// Sprint 2.6 — pack offline downloads.
// Cache ownership: Cache Storage holds immutable pack assets under
// `pack-<appBuild>-<packVersion>` (SW verifies SHA-256 before storing);
// IndexedDB holds pack metadata. Bump APP_BUILD with the SW's APP_BUILD
// whenever the cache format changes.

export const APP_BUILD = 'v3';
const DB_NAME = 'lucid-offline';
const DB_VERSION = 1;
const STORE = 'packs';

export type PackAsset = { url: string; kind: string; sha256: string; bytes: number };

export type PackManifest = {
  schema: number;
  slug: string;
  version: string;
  generatedAt: string;
  pack: {
    id: string;
    slug: string;
    title: string;
    is_free: boolean;
    age_band: string | null;
    objectives: string[];
  };
  lessons: Array<{
    id: string;
    title: string;
    est_minutes: number | null;
    status: string;
    coloring_template_id: string | null;
    steps: Array<{
      id: string;
      type: string;
      title: string;
      order_index: number;
      guide: unknown;
      rubric: unknown;
      hints: unknown;
    }>;
  }>;
  templates: Array<{ id: string; title: string; image_path: string }>;
  assets: PackAsset[];
  size_bytes: number;
};

export type PackRecord = {
  slug: string;
  version: string;
  cacheName: string;
  sizeBytes: number;
  downloadedAt: string;
};

export type PackStatus =
  | { state: 'none' }
  | { state: 'downloaded'; record: PackRecord; updateAvailable: boolean }
  | { state: 'no-manifest' };

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'slug' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idb = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
};

const cacheNameFor = (version: string) => `pack-${APP_BUILD}-${version}`;

export const fetchPackManifest = async (slug: string): Promise<PackManifest | null> => {
  const res = await fetch(`/packs/${slug}/manifest.json`);
  if (!res.ok) return null;
  return res.json();
};

export const getPackStatus = async (slug: string): Promise<PackStatus> => {
  if (typeof indexedDB === 'undefined') return { state: 'none' };
  const manifest = await fetchPackManifest(slug);
  if (!manifest) return { state: 'no-manifest' };
  const record = await idb<PackRecord | undefined>('readonly', (s) => s.get(slug));
  if (!record) return { state: 'none' };
  const present = typeof caches !== 'undefined' && (await caches.has(record.cacheName));
  if (!present) {
    await idb('readwrite', (s) => s.delete(slug));
    return { state: 'none' };
  }
  return {
    state: 'downloaded',
    record,
    updateAvailable: record.version !== manifest.version,
  };
};

export const downloadPack = async (
  slug: string,
  onProgress?: (done: number, total: number) => void
): Promise<PackRecord> => {
  const manifest = await fetchPackManifest(slug);
  if (!manifest) throw new Error('pack manifest not found');

  const cacheName = cacheNameFor(manifest.version);
  const reg = await navigator.serviceWorker.ready;
  const worker = reg.active ?? reg.waiting ?? reg.installing;
  if (!worker) throw new Error('service worker not active');

  await new Promise<void>((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.cacheName !== cacheName) return;
      if (data.type === 'PACK_PROGRESS') onProgress?.(data.done, data.total);
      if (data.type === 'PACK_DONE') {
        navigator.serviceWorker.removeEventListener('message', listener);
        resolve();
      }
      if (data.type === 'PACK_ERROR') {
        navigator.serviceWorker.removeEventListener('message', listener);
        reject(new Error(data.error || 'pack download failed'));
      }
    };
    navigator.serviceWorker.addEventListener('message', listener);
    worker.postMessage({
      type: 'PREFETCH_PACK',
      payload: { cacheName, assets: manifest.assets },
    });
  });

  const record: PackRecord = {
    slug,
    version: manifest.version,
    cacheName,
    sizeBytes: manifest.size_bytes,
    downloadedAt: new Date().toISOString(),
  };
  await idb('readwrite', (s) => s.put(record));
  return record;
};

export const listDownloadedPacks = async (): Promise<PackRecord[]> => {
  if (typeof indexedDB === 'undefined') return [];
  const all = await idb<PackRecord[]>('readonly', (s) => s.getAll() as IDBRequest<PackRecord[]>);
  return all ?? [];
};

export const removePack = async (slug: string): Promise<void> => {
  const record = await idb<PackRecord | undefined>('readonly', (s) => s.get(slug));
  if (record && 'serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    reg?.active?.postMessage({ type: 'DELETE_PACK', payload: { cacheName: record.cacheName } });
  }
  await idb('readwrite', (s) => s.delete(slug));
};

export const formatBytes = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
