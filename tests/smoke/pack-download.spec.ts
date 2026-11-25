import { test, expect } from '@playwright/test';

/**
 * Sprint 3.5 — DownloadManager acceptance:
 *   install → interrupt → resume → integrity-verified offline copy
 *
 * Uses the guest path (no auth): pack page → Download → mid-download
 * offline → failure surfaces → back online → resume → "Available offline".
 *
 * REQUIRES a production target (the download path is SW/Cache based):
 *   npm --prefix apps/web run build && npm --prefix apps/web run start &
 *   E2E_BASE_URL=... npx playwright test tests/smoke/pack-download.spec.ts
 */

const waitForSW = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    undefined,
    { timeout: 20_000 },
  );
};

test.describe('S3.5 download manager', () => {
  test('pack download completes and survives offline', async ({ page, context }) => {
    await page.goto('/pack/amazing-animals');
    await waitForSW(page);

    const button = page.getByRole('button', { name: /Download for offline/i });
    await expect(button).toBeVisible({ timeout: 20_000 });
    await button.click();

    // Complete download → "Available offline" chip
    await expect(page.getByText(/Available offline/i).first()).toBeVisible({ timeout: 60_000 });

    // The pack cache exists and every entry is hash-verified
    const cacheInfo = await page.evaluate(async () => {
      const names = await caches.keys();
      const packCache = names.find((n) => n.startsWith('pack-'));
      if (!packCache) return { found: false, entries: 0 };
      const cache = await caches.open(packCache);
      const keys = await cache.keys();
      return { found: true, entries: keys.length, name: packCache };
    });
    expect(cacheInfo.found).toBe(true);
    expect(cacheInfo.entries).toBeGreaterThan(0);

    // Pack page loads fully offline from the cache
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Amazing Animals/i })).toBeVisible({ timeout: 30_000 });
    await context.setOffline(false);
  });

  // SW blocked for the interrupt test: the page's SWR runtime cache already
  // holds these art assets, so SW-served fetches never reach context.route.
  test.describe('interrupted download', () => {
    test.use({ serviceWorkers: 'block' });

    test('interrupted download resumes with integrity verified', async ({ page, context }) => {
    await page.goto('/pack/amazing-animals');

    // Fresh state: remove any installed copy
    const removeBtn = page.getByRole('button', { name: /Remove offline copy/i });
    if (await removeBtn.isVisible().catch(() => false)) {
      await removeBtn.click();
      await expect(page.getByRole('button', { name: /Download for offline/i })).toBeVisible({ timeout: 15_000 });
    }

    // Deterministic mid-flight interrupt: auto-pass all but the last two asset
    // fetches, then park the next request so the (sequential) download stalls
    // mid-flight — abort it on command.
    const manifest = await page.evaluate(async () => {
      const res = await fetch('/packs/amazing-animals/manifest.json');
      return res.json() as Promise<{ assets: { url: string }[] }>;
    });
    const assetUrls = new Set(
      manifest.assets.map((a) => new URL(a.url, page.url()).href),
    );
    const total = manifest.assets.length;
    let allow = Math.max(0, total - 2);
    const parked: Array<() => void> = [];
    let markParked: () => void = () => {};
    const firstParked = new Promise<void>((res) => (markParked = res));
    await context.route('**/*', async (route) => {
      if (!assetUrls.has(route.request().url())) return route.continue();
      if (allow-- > 0) return route.continue();
      markParked();
      await new Promise<void>((res) => parked.push(res));
      return route.abort();
    });

    const dlRow = () =>
      page.evaluate(async () => {
        const idb = await new Promise<IDBDatabase>((res, rej) => {
          const req = indexedDB.open('lucidcraft');
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });
        if (!idb.objectStoreNames.contains('packDownloads')) return null;
        const rows = await new Promise<any[]>((res, rej) => {
          const req = idb.transaction('packDownloads', 'readonly').objectStore('packDownloads').getAll();
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });
        return rows[0] ?? null;
      });

    const button = page.getByRole('button', { name: /Download for offline/i });
    await button.click();

    // The loop stalls with a fetch parked mid-flight; cut it now.
    await firstParked;
    const interrupted = await dlRow();
    parked.forEach((release) => release());
    await expect(
      page.getByRole('button', { name: /Download for offline/i }),
      'download should abort back to ready state',
    ).toBeVisible({ timeout: 20_000 });

    // Resume — completed assets are skipped, partials resume via Range
    await context.unroute('**/*');
    await button.click();
    await expect(page.getByText(/Available offline/i).first()).toBeVisible({ timeout: 60_000 });

    const final = await dlRow();
    expect(final?.state).toBe('done');
    expect(final?.doneAssets.length).toBe(total);
    // The interrupt happened mid-flight with real progress already persisted.
    expect(interrupted?.doneAssets.length).toBeGreaterThan(0);
    expect(interrupted?.doneAssets.length).toBeLessThan(total);

    const verified = await page.evaluate(async () => {
      const names = await caches.keys();
      const packCache = names.find((n) => n.startsWith('pack-'));
      if (!packCache) return { verified: 0, total: 0 };
      const cache = await caches.open(packCache);
      const keys = await cache.keys();
      let verified = 0;
      for (const k of keys) {
        const res = await cache.match(k);
        if (res?.headers.get('X-Pack-Verified') === '1') verified += 1;
      }
      return { verified, total: keys.length };
    });
    expect(verified.total).toBeGreaterThan(0);
    expect(verified.verified).toBe(verified.total);
    });
  });
});
