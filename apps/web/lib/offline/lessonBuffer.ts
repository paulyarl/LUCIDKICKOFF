// Sprint 2.14 — per-lesson L0 buffer (D35). On devices that can't hold a whole
// pack, the current lesson's media is prefetched (manifest-verified where the
// pack manifest provides hashes) into `lessonbuf-<appBuild>-<lessonId>` so it
// plays offline. Cache ownership mirrors packs: Cache Storage for bytes.
//
// Failure contract: prefetch is all-or-nothing in the SW — an interrupted
// prefetch deletes the cache, so a partial buffer can never be served.

import { APP_BUILD, fetchPackManifest, type PackManifest } from './packs';

const MEDIA_KEYS = new Set(['image', 'overlay', 'mask', 'badge']);

export const lessonCacheName = (lessonId: string) => `lessonbuf-${APP_BUILD}-${lessonId}`;

type BufferedAsset = { url: string; sha256?: string };

// Same recursion as scripts/export-pack-manifest.js — media fields on
// guide/rubric/hints hold `/art/...` paths or absolute storage URLs.
const collectMediaUrls = (node: unknown, into: Set<string>) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v) => collectMediaUrls(v, into));
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (
      MEDIA_KEYS.has(key) &&
      typeof value === 'string' &&
      (/^https?:\/\//.test(value) || value.startsWith('/'))
    ) {
      into.add(value);
    } else {
      collectMediaUrls(value, into);
    }
  }
};

/** Lesson assets = media urls in the step payloads, verified against the manifest's sha256 map when present. */
export const lessonAssets = (
  steps: Array<{ guide?: unknown; rubric?: unknown; hints?: unknown }>,
  manifest: PackManifest,
): BufferedAsset[] => {
  const urls = new Set<string>();
  for (const step of steps) {
    collectMediaUrls(step.guide, urls);
    collectMediaUrls(step.rubric, urls);
    collectMediaUrls(step.hints, urls);
  }
  const hashed = new Map(manifest.assets.map((a) => [a.url, a.sha256]));
  return [...urls].map((url) => {
    const sha256 = hashed.get(url);
    return sha256 ? { url, sha256 } : { url };
  });
};

export const isLessonBuffered = async (lessonId: string): Promise<boolean> =>
  typeof caches !== 'undefined' && caches.has(lessonCacheName(lessonId));

export type BufferResult =
  | { state: 'buffered'; total: number }
  | { state: 'unavailable' }; // no SW, no manifest, or nothing to fetch

/**
 * Prefetch this lesson's assets into its buffer cache. `steps` are the
 * already-parsed step payloads; `manifest` supplies verification hashes.
 * No-op resolve when the buffer already exists.
 */
export const bufferLesson = async (
  lessonId: string,
  manifest: PackManifest,
  steps: Array<{ guide?: unknown; rubric?: unknown; hints?: unknown }>,
  onProgress?: (done: number, total: number) => void,
): Promise<BufferResult> => {
  const assets = lessonAssets(steps, manifest);
  if (!assets.length) return { state: 'unavailable' };

  const cacheName = lessonCacheName(lessonId);
  if (await caches.has(cacheName)) return { state: 'buffered', total: assets.length };

  const reg = await navigator.serviceWorker.ready;
  const worker = reg.active ?? reg.waiting ?? reg.installing;
  if (!worker) return { state: 'unavailable' };

  await new Promise<void>((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.cacheName !== cacheName) return;
      if (data.type === 'LESSON_PROGRESS') onProgress?.(data.done, data.total);
      if (data.type === 'LESSON_DONE') {
        navigator.serviceWorker.removeEventListener('message', listener);
        resolve();
      }
      if (data.type === 'LESSON_ERROR') {
        navigator.serviceWorker.removeEventListener('message', listener);
        reject(new Error(data.error || 'lesson prefetch failed'));
      }
    };
    navigator.serviceWorker.addEventListener('message', listener);
    worker.postMessage({
      type: 'PREFETCH_LESSON',
      payload: { cacheName, assets },
    });
  });

  return { state: 'buffered', total: assets.length };
};

/** Resolve the pack manifest for a lesson (null when not in an exported pack). */
export const manifestForLesson = async (packSlug: string | null): Promise<PackManifest | null> =>
  packSlug ? fetchPackManifest(packSlug) : null;

export const dropLessonBuffer = async (lessonId: string): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    reg?.active?.postMessage({
      type: 'DELETE_LESSON',
      payload: { cacheName: lessonCacheName(lessonId) },
    });
  }
};
