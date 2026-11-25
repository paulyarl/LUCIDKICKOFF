'use client';

import { useCallback, useEffect, useState } from 'react';

// Sprint 2.13 — device profile + offline tier detection (D34/D36/D38).
//
// L0  constrained: no SW / saveData / 2g / <400 MB free / <=1 GB RAM — stream
//     lessons with prefetch, no pack downloads
// L1  typical: SW-capable, adequate storage — on-demand pack downloads
// L2  full offline: >=1 GB free, >=4 GB RAM, 4g — storage.persist() is
//     requested on entry but L2 is allowed regardless of the grant (D38)
//
// Hysteresis: upgrades require 2 consecutive agreeing samples; downgrades
// apply at the hard floor immediately, otherwise also require 2 samples.
// Guardian override lives in profile settings JSONB (tier_override).

export type Tier = 'L0' | 'L1' | 'L2';
export type TierOverride = Tier | 'auto';

export type DeviceProfile = {
  quotaBytes: number | null;
  usageBytes: number | null;
  deviceMemoryGB: number | null;
  effectiveType: string | null;
  saveData: boolean;
  swSupported: boolean;
  persisted: boolean | null;
};

export type TierState = {
  tier: Tier;
  override: TierOverride;
  profile: DeviceProfile | null;
};

const STATE_KEY = 'lc-tier';
const RANK: Record<Tier, number> = { L0: 0, L1: 1, L2: 2 };
const FREE_FLOOR = 400 * 1024 * 1024;
const FREE_L2 = 1024 * 1024 * 1024;
const CONFIRM_SAMPLES = 2;

type StoredState = { tier: Tier; pending: Tier | null; pendingCount: number };

const readState = (): StoredState => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {}
  return { tier: 'L1', pending: null, pendingCount: 0 };
};

const writeState = (s: StoredState) => {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {}
};

export const sampleDevice = async (): Promise<DeviceProfile> => {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; saveData?: boolean };
  };
  let quota: number | null = null;
  let usage: number | null = null;
  let persisted: boolean | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    quota = est?.quota ?? null;
    usage = est?.usage ?? null;
  } catch {}
  try {
    persisted = (await navigator.storage?.persisted?.()) ?? null;
  } catch {}
  return {
    quotaBytes: quota,
    usageBytes: usage,
    deviceMemoryGB: nav.deviceMemory ?? null,
    effectiveType: nav.connection?.effectiveType ?? null,
    saveData: !!nav.connection?.saveData,
    swSupported: 'serviceWorker' in navigator,
    persisted,
  };
};

export const freeBytes = (p: DeviceProfile): number | null =>
  p.quotaBytes != null && p.usageBytes != null ? p.quotaBytes - p.usageBytes : null;

export const classifyTier = (p: DeviceProfile): Tier => {
  const free = freeBytes(p);
  if (
    !p.swSupported ||
    p.saveData ||
    p.effectiveType === '2g' ||
    p.effectiveType === 'slow-2g' ||
    (free != null && free < FREE_FLOOR) ||
    (p.deviceMemoryGB != null && p.deviceMemoryGB <= 1)
  ) {
    return 'L0';
  }
  if (
    (free == null || free >= FREE_L2) &&
    (p.deviceMemoryGB == null || p.deviceMemoryGB >= 4) &&
    (p.effectiveType == null || p.effectiveType === '4g')
  ) {
    return 'L2';
  }
  return 'L1';
};

/**
 * Apply hysteresis + override to a fresh classification. Side effects: writes
 * the hysteresis state and requests storage.persist() on L1->L2 entry (D38 —
 * the tier is granted regardless of the browser's answer).
 */
export const resolveTier = (
  p: DeviceProfile,
  override: TierOverride = 'auto',
): { tier: Tier; transitioned: boolean } => {
  if (override !== 'auto') return { tier: override, transitioned: false };

  const state = readState();
  const candidate = classifyTier(p);
  if (candidate === state.tier) {
    if (state.pending) writeState({ ...state, pending: null, pendingCount: 0 });
    return { tier: state.tier, transitioned: false };
  }

  const free = freeBytes(p);
  const isDowngrade = RANK[candidate] < RANK[state.tier];
  const hardFloor = isDowngrade && free != null && free < FREE_FLOOR / 2;
  const nextCount = state.pending === candidate ? state.pendingCount + 1 : 1;

  if (!hardFloor && nextCount < CONFIRM_SAMPLES) {
    writeState({ ...state, pending: candidate, pendingCount: nextCount });
    return { tier: state.tier, transitioned: false };
  }

  writeState({ tier: candidate, pending: null, pendingCount: 0 });
  if (candidate === 'L2' && RANK[state.tier] < RANK.L2) {
    void navigator.storage?.persist?.().then((granted) => {
      try {
        localStorage.setItem('lc-tier-persisted', granted ? '1' : '0');
      } catch {}
    });
  }
  return { tier: candidate, transitioned: true };
};

const OVERRIDE_KEY = 'lc-tier-override';

export const getTierOverride = (): TierOverride => {
  try {
    const v = localStorage.getItem(OVERRIDE_KEY);
    if (v === 'L0' || v === 'L1' || v === 'L2') return v;
  } catch {}
  return 'auto';
};

export const setTierOverride = (v: TierOverride) => {
  try {
    localStorage.setItem(OVERRIDE_KEY, v);
  } catch {}
};

export const useDeviceProfile = (override?: TierOverride) => {
  const [state, setState] = useState<TierState>({ tier: 'L1', override: 'auto', profile: null });

  const refresh = useCallback(async () => {
    const effective = override ?? getTierOverride();
    const profile = await sampleDevice();
    const { tier } = resolveTier(profile, effective);
    // S3.8 — keep the SW's cache budgets aligned with the active tier.
    navigator.serviceWorker?.ready
      .then((reg) => reg.active?.postMessage({ type: 'SET_TIER', payload: { tier } }))
      .catch(() => {});
    setState({ tier, override: effective, profile });
  }, [override]);

  useEffect(() => {
    refresh();
    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    conn?.addEventListener?.('change', refresh);
    return () => conn?.removeEventListener?.('change', refresh);
  }, [refresh]);

  return { ...state, refresh };
};
