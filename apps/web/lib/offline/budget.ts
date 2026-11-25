// Sprint 3.8 — storage-budget manager (D34).
//
// Budget = min(60% of device quota, guardian cap). Only pack binaries
// (Cache Storage `pack-*` entries + their PackRecord rows) are eviction
// candidates — progress, artwork and outbox data in IndexedDB are never
// touched. Eviction is LRU by `lastUsedAt`; pinned packs and the most
// recently used pack (the active one) are protected.

import { listDownloadedPacks, removePack, type PackRecord } from './packs';

const CAP_KEY = 'lc-storage-cap-bytes';
const QUOTA_SHARE = 0.6;

/** Guardian-set cap in bytes; null = uncapped (budget is just 60% of quota). */
export const getStorageCapBytes = (): number | null => {
  try {
    const raw = localStorage.getItem(CAP_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
};

export const setStorageCapBytes = (bytes: number | null) => {
  try {
    if (bytes == null || bytes <= 0) localStorage.removeItem(CAP_KEY);
    else localStorage.setItem(CAP_KEY, String(Math.floor(bytes)));
  } catch {}
};

export type BudgetSnapshot = {
  quotaBytes: number | null;
  budgetBytes: number | null; // min(60% quota, cap) — null if quota unknown
  capBytes: number | null;
  packBytes: number; // recorded footprint of downloaded packs
  freeForPacks: number | null;
};

export const getBudgetSnapshot = async (): Promise<BudgetSnapshot> => {
  const capBytes = getStorageCapBytes();
  let quotaBytes: number | null = null;
  try {
    quotaBytes = (await navigator.storage?.estimate?.())?.quota ?? null;
  } catch {}
  const records = await listDownloadedPacks().catch(() => [] as PackRecord[]);
  const packBytes = records.reduce((s, r) => s + r.sizeBytes, 0);
  const share = quotaBytes != null ? quotaBytes * QUOTA_SHARE : null;
  const budgetBytes =
    share == null ? capBytes : capBytes == null ? share : Math.min(share, capBytes);
  return {
    quotaBytes,
    budgetBytes,
    capBytes,
    packBytes,
    freeForPacks: budgetBytes == null ? null : budgetBytes - packBytes,
  };
};

const evictableOrder = (records: PackRecord[]): PackRecord[] => {
  // LRU ascending; pinned rows are never candidates.
  const unpinned = records.filter((r) => !r.pinned);
  // The most recently used pack overall is the "active" pack — protect it too.
  const active = records.reduce<PackRecord | null>(
    (best, r) => ((r.lastUsedAt ?? 0) > (best?.lastUsedAt ?? 0) ? r : best),
    null,
  );
  return unpinned
    .filter((r) => r !== active)
    .sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0));
};

/**
 * Evict least-recently-used pack binaries until `neededBytes` more fit inside
 * the budget. Returns the slugs evicted. Throws if even a full eviction can't
 * make room (everything pinned/active, or budget smaller than the request).
 */
export const evictForBudget = async (neededBytes: number): Promise<string[]> => {
  const snap = await getBudgetSnapshot();
  if (snap.budgetBytes == null) return []; // no quota signal — don't guess

  let deficit = snap.packBytes + neededBytes - snap.budgetBytes;
  if (deficit <= 0) return [];

  const evicted: string[] = [];
  for (const record of evictableOrder(await listDownloadedPacks())) {
    if (deficit <= 0) break;
    await removePack(record.slug).catch(() => {});
    evicted.push(record.slug);
    deficit -= record.sizeBytes;
  }
  if (deficit > 0 && neededBytes > 0) {
    throw new Error(
      `not enough offline storage: need ${neededBytes} bytes, budget ${snap.budgetBytes}`,
    );
  }
  return evicted;
};

/** Proactive sweep — evict until the footprint is back inside budget. */
export const enforceBudget = async (): Promise<string[]> => evictForBudget(0);
