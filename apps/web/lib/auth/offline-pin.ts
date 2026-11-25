"use client";

import { scrypt } from "scrypt-js";

/**
 * E.3 — offline PIN verification (D59). The verifier cache is a read-only
 * replica of server state: written from the trusted listing payload, never
 * authoritative. Offline enforcement is a sibling-boundary UX gate, not a hard
 * security boundary — see D59's threat model.
 */

const CACHE_KEY = "lc_pin_verifiers_v1";
const ACTIVE_CHILD_KEY = "lc_active_child_v1";
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type CachedVerifier = {
  hash: string;
  failedAttempts: number;
  lockedUntil: string | null;
  syncedAt: number;
  nickname: string | null;
  avatarUrl: string | null;
};

type Cache = Record<string, CachedVerifier>;

function readCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Cache;
  } catch {
    return {};
  }
}

function writeCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full or unavailable — offline verification simply degrades
  }
}

export type VerifierSyncRow = {
  id: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  pinVerifier?: string | null;
  pinFailedAttempts?: number | null;
  pinLockedUntil?: string | null;
};

/** Refresh the replica from a trusted online listing payload. */
export function syncVerifiers(rows: VerifierSyncRow[]) {
  const cache = readCache();
  const now = Date.now();
  for (const row of rows) {
    if (!row.pinVerifier) continue;
    cache[row.id] = {
      hash: row.pinVerifier,
      failedAttempts: row.pinFailedAttempts ?? 0,
      lockedUntil: row.pinLockedUntil ?? null,
      syncedAt: now,
      nickname: row.nickname ?? cache[row.id]?.nickname ?? null,
      avatarUrl: row.avatarUrl ?? cache[row.id]?.avatarUrl ?? null,
    };
  }
  writeCache(cache);
}

/** Cached learner display data — lets the picker render with no network. */
export function getCachedLearners(): { id: string; nickname: string | null; avatarUrl: string | null; hasPin: boolean }[] {
  return Object.entries(readCache()).map(([id, entry]) => ({
    id,
    nickname: entry.nickname,
    avatarUrl: entry.avatarUrl,
    hasPin: true,
  }));
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Must match apps/web/lib/auth/pin.ts: Node scrypt defaults N=16384, r=8, p=1, keylen 64.
async function scryptPin(pin: string, saltHex: string): Promise<string> {
  const password = new TextEncoder().encode(pin);
  const salt = hexToBytes(saltHex);
  const derived = await scrypt(password, salt, 16384, 8, 1, 64);
  return Array.from(derived).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type OfflineVerifyResult =
  | { ok: true }
  | { ok: false; error: string; locked: boolean };

export function hasCachedVerifier(profileId: string): boolean {
  return Boolean(readCache()[profileId]);
}

/**
 * Verify a PIN against the cached replica while offline. Honours the cached
 * lockout and tracks failures locally; offline failures are NOT synced back
 * to the server in v1 (documented in D59 — the casual sibling case is the
 * honest scope of this gate).
 */
export async function verifyPinOffline(profileId: string, pin: string): Promise<OfflineVerifyResult> {
  const cache = readCache();
  const entry = cache[profileId];
  if (!entry) {
    return { ok: false, error: "Offline sign-in isn't set up on this tablet yet. Connect once and try again.", locked: false };
  }
  if (entry.lockedUntil && new Date(entry.lockedUntil) > new Date()) {
    return { ok: false, error: "Too many attempts. Try again later.", locked: true };
  }

  const [, salt, expected] = entry.hash.split("$");
  if (!salt || !expected) return { ok: false, error: "Offline sign-in is unavailable.", locked: false };
  const candidate = await scryptPin(pin, salt);

  if (candidate !== expected) {
    const failedAttempts = entry.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
    cache[profileId] = { ...entry, failedAttempts, lockedUntil };
    writeCache(cache);
    return {
      ok: false,
      error: lockedUntil ? "Too many attempts. Try again later." : "Incorrect PIN.",
      locked: Boolean(lockedUntil),
    };
  }

  cache[profileId] = { ...entry, failedAttempts: 0, lockedUntil: null };
  writeCache(cache);
  return { ok: true };
}

/** The offline session marker — the seam downstream surfaces read (D59). */
export function setActiveChildOffline(profile: { id: string; nickname: string | null; avatarUrl: string | null }) {
  try {
    localStorage.setItem(
      ACTIVE_CHILD_KEY,
      JSON.stringify({ ...profile, at: Date.now(), offline: true }),
    );
  } catch {}
}

export function getActiveChildOffline(): { id: string; nickname: string | null; avatarUrl: string | null; at: number; offline: boolean } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CHILD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveChildOffline() {
  try {
    localStorage.removeItem(ACTIVE_CHILD_KEY);
  } catch {}
}
