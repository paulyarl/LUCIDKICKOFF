import { test, expect } from '@playwright/test';

/**
 * Sprint 2.7 — airplane-mode acceptance (spec DoD):
 *   install → offline → play → reload → resume → reconnect
 *
 * Uses the guest path (no auth): pack → lesson → step → offline → steps →
 * reload → resume → reconnect. Progress is verified from localStorage.
 *
 * REQUIRES a production target — the service worker is gated on
 * NODE_ENV=production and never registers under `next dev`:
 *   npm --prefix apps/web run build && npm --prefix apps/web run start &
 *   npx playwright test tests/smoke/airplane-mode.spec.ts
 * or point it at the deploy:
 *   E2E_BASE_URL=https://genuine-cheesecake-327d05.netlify.app \
 *     npx playwright test tests/smoke/airplane-mode.spec.ts
 */

const waitForSW = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    undefined,
    { timeout: 20_000 },
  );
};

test.describe('S2.7 airplane mode', () => {
  test('guest plays, goes offline, reloads and resumes', async ({ page, context }) => {
    // --- install: load the pack, let the SW take control ---
    await page.goto('/pack/amazing-animals');
    await waitForSW(page);

    // --- play: open lesson 1, buffer gate resolves, finish step 1 ---
    await page.locator('a[href^="/learn/lesson/"]').first().click();
    // Buffer gate shows "Getting your lesson ready…" then mounts the player
    await expect(page.getByText(/Step 1 of \d+/)).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/Step 2 of \d+/)).toBeVisible();

    // --- offline: connectivity monitor flips, banner appears ---
    await context.setOffline(true);
    await expect(page.getByText(/offline/i).first()).toBeVisible({ timeout: 15_000 });

    // The lesson buffer exists — verify the SW wrote a lessonbuf cache
    const buffers = await page.evaluate(() => caches.keys());
    expect(buffers.some((name) => name.startsWith('lessonbuf-'))).toBe(true);

    // --- reload while fully offline: SWR page cache + buffer must serve ---
    await page.reload();
    await expect(page.getByText(/Step 2 of \d+/)).toBeVisible({ timeout: 30_000 });

    // --- reconnect: banner clears, app is back online ---
    await context.setOffline(false);
    await expect(page.getByText(/offline — progress/i)).toBeHidden({ timeout: 20_000 });

    // Progress survived the whole trip, keyed to the guest learner
    const saved = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith('lc-progress:guest:')),
    );
    expect(saved.length).toBeGreaterThan(0);
    const snapshot = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      saved[0],
    );
    expect(snapshot.stepIndex).toBeGreaterThanOrEqual(1);
  });
});
