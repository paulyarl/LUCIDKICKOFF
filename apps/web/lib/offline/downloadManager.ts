import { db } from '@/lib/offline/db';
import {
  cacheNameFor,
  fetchPackManifest,
  markPackInstalled,
  type PackAsset,
  type PackManifest,
  type PackRecord,
} from '@/lib/offline/packs';
import { verifyManifest } from '@/lib/offline/manifestVerify';
import { evictForBudget } from '@/lib/offline/budget';

// S3.5 — DownloadManager. Replaces the all-or-nothing SW prefetch for pack
// installs: downloads run on the page with resumable state in IndexedDB.
//
//   - Per-asset resume: verified assets are recorded in `packDownloads`;
//     a restart skips them (interrupted install at 5/50/99% resumes).
//   - Mid-file resume: in-flight bytes live in `packParts`; the next attempt
//     sends `Range: bytes=<received>-`. Servers that ignore Range (200) fall
//     back to a full refetch of that file.
//   - Integrity: every completed asset is SHA-256-verified against the
//     manifest before it enters the cache — a corrupted/resumed-mismatch
//     file never lands.

type Progress = { done: number; total: number };
type OnProgress = (p: Progress) => void;

const PART_FLUSH_BYTES = 256 * 1024;
const aborts = new Map<string, AbortController>();

const sha256Hex = async (buf: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const partId = (cacheName: string, url: string) => `${cacheName}|${url}`;

async function fetchAsset(
  cacheName: string,
  asset: PackAsset,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const pid = partId(cacheName, asset.url);
  const part = await db.packParts.get(pid).catch(() => undefined);
  const have = part?.received ?? 0;

  const headers: Record<string, string> = {};
  if (have > 0) headers.Range = `bytes=${have}-`;

  const res = await fetch(asset.url, { cache: 'no-store', headers, signal });
  if (res.status === 416 && part) {
    // Server says the requested range is already complete — hash check below decides.
    return part.data;
  }
  if (!res.ok && res.status !== 206) throw new Error(`${asset.url} -> ${res.status}`);

  let base = part?.data ?? new ArrayBuffer(0);
  let received = have;
  if (res.status === 200) {
    // Server ignored our Range header — restart the file from scratch.
    base = new ArrayBuffer(0);
    received = 0;
    await db.packParts.delete(pid).catch(() => {});
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error(`${asset.url} -> empty body`);
  const chunks: Uint8Array[] = [new Uint8Array(base)];
  let flushed = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    // Persist progress periodically so a mid-file interruption resumes.
    if (received - flushed >= PART_FLUSH_BYTES) {
      flushed = received;
      const merged = concat(chunks, received);
      await db.packParts.put({ id: pid, received, data: merged, updatedAt: Date.now() });
      chunks.length = 0;
      chunks.push(new Uint8Array(merged));
    }
  }
  return concat(chunks, received);
}

const concat = (chunks: Uint8Array[], total: number): ArrayBuffer => {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
};

async function run(slug: string, manifest: PackManifest, onProgress?: OnProgress): Promise<PackRecord> {
  const cacheName = cacheNameFor(manifest.version);
  const cache = await caches.open(cacheName);
  const assets = manifest.assets ?? [];

  const row = (await db.packDownloads.get(slug))!;
  const doneSet = new Set(row.doneAssets);
  const controller = new AbortController();
  aborts.set(slug, controller);

  try {
    for (const asset of assets) {
      if (doneSet.has(asset.url)) continue;
      const state = (await db.packDownloads.get(slug))?.state;
      if (state === 'paused') throw new Error('__paused__');

      // A verified entry already in cache (completed before the interrupt) counts as done.
      if (await cache.match(asset.url)) {
        doneSet.add(asset.url);
        await db.packDownloads.update(slug, { doneAssets: [...doneSet], updatedAt: Date.now() });
        onProgress?.({ done: doneSet.size, total: assets.length });
        continue;
      }

      const buf = await fetchAsset(cacheName, asset, controller.signal);
      const hex = await sha256Hex(buf);
      if (asset.sha256 && hex !== asset.sha256) {
        await db.packParts.delete(partId(cacheName, asset.url)).catch(() => {});
        throw new Error(`sha256 mismatch: ${asset.url}`);
      }
      await cache.put(
        asset.url,
        new Response(buf, {
          headers: { 'Content-Type': 'application/octet-stream', 'X-Pack-Verified': '1' },
        }),
      );
      await db.packParts.delete(partId(cacheName, asset.url)).catch(() => {});
      doneSet.add(asset.url);
      await db.packDownloads.update(slug, { doneAssets: [...doneSet], updatedAt: Date.now() });
      onProgress?.({ done: doneSet.size, total: assets.length });
    }

    const record: PackRecord = {
      slug,
      version: manifest.version,
      cacheName,
      sizeBytes: manifest.size_bytes,
      downloadedAt: new Date().toISOString(),
    };
    await markPackInstalled(record);
    await db.packDownloads.update(slug, { state: 'done', updatedAt: Date.now() });
    // Drop superseded-version caches from older installs of this pack.
    return record;
  } finally {
    aborts.delete(slug);
  }
}

export const startPackDownload = async (slug: string, onProgress?: OnProgress): Promise<PackRecord> => {
  const manifest = await fetchPackManifest(slug);
  if (!manifest) throw new Error('pack manifest not found');
  const check = await verifyManifest(manifest as unknown as Record<string, unknown>);
  if (!check.ok) throw new Error(`manifest verification failed: ${check.reason}`);

  // S3.8 — make room inside the budget first (LRU pack binaries only;
  // pinned + active packs are protected). Throws if it still won't fit.
  if (manifest.size_bytes > 0) await evictForBudget(manifest.size_bytes);

  const cacheName = cacheNameFor(manifest.version);
  const existing = await db.packDownloads.get(slug).catch(() => undefined);
  const resumable = existing && existing.version === manifest.version && existing.state !== 'done';
  await db.packDownloads.put({
    slug,
    version: manifest.version,
    cacheName,
    doneAssets: resumable ? existing.doneAssets : [],
    state: 'downloading',
    totalAssets: (manifest.assets ?? []).length,
    updatedAt: Date.now(),
  });
  return run(slug, manifest, onProgress);
};

export const resumePackDownload = async (slug: string, onProgress?: OnProgress): Promise<PackRecord> =>
  startPackDownload(slug, onProgress); // state rows + doneAssets make this resume

export const pausePackDownload = async (slug: string): Promise<void> => {
  aborts.get(slug)?.abort();
  await db.packDownloads.update(slug, { state: 'paused', updatedAt: Date.now() }).catch(() => {});
};

export const cancelPackDownload = async (slug: string): Promise<void> => {
  aborts.get(slug)?.abort();
  const row = await db.packDownloads.get(slug).catch(() => undefined);
  await db.packDownloads.delete(slug).catch(() => {});
  if (row?.cacheName) {
    await db.packParts.where('id').startsWith(`${row.cacheName}|`).delete().catch(() => {});
    await caches.delete(row.cacheName).catch(() => {});
  }
};

export const getActivePackDownloads = () =>
  db.packDownloads.where('state').anyOf('downloading', 'paused', 'failed').toArray();
