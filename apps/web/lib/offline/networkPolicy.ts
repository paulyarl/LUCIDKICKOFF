// Sprint 3.9 — network policy + retry/backoff (D37–D40).
//
// One shared view of connection quality (saveData / effectiveType / metered)
// plus the bounded exponential backoff used by the sync outbox and the SW's
// drain loop. Note: a pure PWA cannot detect "Wi-Fi" — policy is expressed in
// metered/data-saver terms only.

export type NetworkPolicy = {
  saveData: boolean;
  effectiveType: string | null;
  metered: boolean;
};

type Conn = { saveData?: boolean; effectiveType?: string; metered?: boolean };

export const networkPolicy = (): NetworkPolicy => {
  const c = (navigator as Navigator & { connection?: Conn }).connection ?? {};
  return {
    saveData: !!c.saveData,
    effectiveType: c.effectiveType ?? null,
    metered: !!c.metered || c.effectiveType === '2g' || c.effectiveType === 'slow-2g',
  };
};

export type DownloadGate = 'ok' | 'confirm' | 'blocked';

/** Pack downloads: hard-block on Data Saver, confirm on metered/slow links. */
export const downloadGate = (): DownloadGate => {
  const p = networkPolicy();
  if (p.saveData) return 'blocked';
  if (p.metered) return 'confirm';
  return 'ok';
};

// Bounded exponential backoff with jitter: base 5s doubling to a 5-min cap,
// multiplied by a [0.5, 1.0) jitter so fleets don't retry in lockstep.
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_CAP_MS = 5 * 60_000;

export const backoffMs = (attempts: number): number => {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts));
  return Math.floor(exp * (0.5 + Math.random() * 0.5));
};
