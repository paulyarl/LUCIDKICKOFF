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
    notify(res.status < 500 ? 'online' : 'offline');
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

export const useConnectivity = (): Connectivity =>
  useSyncExternalStore(
    (onStoreChange) => {
      const listener = () => onStoreChange();
      listeners.add(listener);
      if (listeners.size === 1) start();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
    () => current,
    () => 'online' as Connectivity
  );
