'use client';

import { useSyncExternalStore } from 'react';

// Sprint 2.15 — connectivity monitor. navigator.onLine is unreliable (it only
// reports NIC state), so we probe /api/health: online returns 200 (<500 =
// connected); offline the SW's health branch returns its 503 fallback (>=500 =
// offline). The SW deliberately never caches this route.
const PROBE_URL = '/api/health';
const INTERVAL_MS = 15_000;

export type Connectivity = 'online' | 'offline';

let current: Connectivity = 'online';
const listeners = new Set<(c: Connectivity) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

const notify = (c: Connectivity) => {
  if (c === current) return;
  current = c;
  listeners.forEach((l) => l(c));
};

const probe = async () => {
  try {
    const res = await fetch(PROBE_URL, { cache: 'no-store' });
    if (res.status >= 500) return notify('offline');
    // S3.9 — captive-portal detection: a hotel/airport portal answers every
    // request with its own 200 interstitial, so a non-JSON or wrong-body
    // response is NOT our health probe — treat it as offline.
    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    notify(res.ok && json?.ok === true ? 'online' : 'offline');
  } catch {
    notify('offline');
  }
};

const onOffline = () => notify('offline');
const onOnline = () => probe();

const start = () => {
  probe();
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);
  timer = setInterval(probe, INTERVAL_MS);
};

const stop = () => {
  window.removeEventListener('offline', onOffline);
  window.removeEventListener('online', onOnline);
  if (timer) clearInterval(timer);
  timer = null;
};

export const isOnline = () => current;

/**
 * S3.9 — non-hook subscription so non-React code (the sync outbox) can ride
 * the same probe. Starts the monitor on first subscriber, stops on last out.
 */
export const subscribeConnectivity = (cb: (c: Connectivity) => void): (() => void) => {
  listeners.add(cb);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) stop();
  };
};

export const useConnectivity = (): Connectivity =>
  useSyncExternalStore(
    (onStoreChange) => subscribeConnectivity(onStoreChange),
    () => current,
    () => 'online' as Connectivity
  );
