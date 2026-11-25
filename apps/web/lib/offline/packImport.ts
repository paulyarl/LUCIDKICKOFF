import { db } from '@/lib/offline/db';
import {
  cacheNameFor,
  markPackInstalled,
  type PackManifest,
  type PackRecord,
} from '@/lib/offline/packs';
import { verifyManifest } from '@/lib/offline/manifestVerify';

// S3.5 / D33 — signed manual pack import for field devices.
//
// A `.lcpack` file is produced by scripts/export-lcpack.cjs and carries the
// manifest (Ed25519-signed) plus every asset as base64. Signature
// verification is REQUIRED — the file itself is the trust boundary on a
// device that may never see the network.

export type LcPackFile = {
  format: 'lcpack';
  manifest: PackManifest & { signature?: string; keyId?: string };
  files: Record<string, { b64: string; sha256: string }>;
};

const sha256Hex = async (buf: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const b64ToBytes = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * Verify + install a .lcpack file into the pack cache, exactly as if it had
 * been downloaded by the DownloadManager. Throws on any verification failure.
 */
export async function importLcPack(
  file: LcPackFile,
  onProgress?: (done: number, total: number) => void,
): Promise<PackRecord> {
  if (file?.format !== 'lcpack' || !file.manifest || typeof file.files !== 'object') {
    throw new Error('not a .lcpack file');
  }
  const manifest = file.manifest;
  const check = await verifyManifest(manifest as unknown as Record<string, unknown>, {
    require: true, // D33 — unsigned imports are rejected outright
  });
  if (!check.ok) throw new Error(`manifest verification failed: ${check.reason}`);

  const cacheName = cacheNameFor(manifest.version);
  const cache = await caches.open(cacheName);
  const assets = manifest.assets ?? [];
  let done = 0;

  for (const asset of assets) {
    const entry = file.files[asset.url];
    if (!entry) throw new Error(`missing file for ${asset.url}`);
    const bytes = b64ToBytes(entry.b64);
    const hex = await sha256Hex(bytes.buffer as ArrayBuffer);
    const expected = asset.sha256 || entry.sha256;
    if (expected && hex !== expected) throw new Error(`sha256 mismatch: ${asset.url}`);
    await cache.put(
      asset.url,
      new Response(bytes, {
        headers: { 'Content-Type': 'application/octet-stream', 'X-Pack-Verified': '1' },
      }),
    );
    done += 1;
    onProgress?.(done, assets.length);
  }

  const record: PackRecord = {
    slug: manifest.slug,
    version: manifest.version,
    cacheName,
    sizeBytes: manifest.size_bytes,
    downloadedAt: new Date().toISOString(),
  };
  await markPackInstalled(record);
  await db.packDownloads
    .put({
      slug: manifest.slug,
      version: manifest.version,
      cacheName,
      doneAssets: assets.map((a) => a.url),
      state: 'done',
      totalAssets: assets.length,
      updatedAt: Date.now(),
    })
    .catch(() => {});
  return record;
}
