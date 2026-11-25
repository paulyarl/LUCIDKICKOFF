"use client";

/**
 * E.5 — guest session v1 (D56). Device-local only: nothing in this module
 * ever reaches the server. Non-evictable by policy — progress here is never
 * silently discarded (storage-eviction handling lands with device tiers in
 * 2.13; localStorage is the interim store, documented in D56).
 */

const SESSION_KEY = "lc_guest_session_v1";
const DISCLOSURE_KEY = "lc_guest_disclosed"; // sessionStorage — once per browser session

export type GuestSession = {
  id: string;
  startedAt: number;
};

export function getGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as GuestSession) : null;
  } catch {
    return null;
  }
}

export function hasGuestSession(): boolean {
  return getGuestSession() !== null;
}

export function startGuestSession(): GuestSession {
  const existing = getGuestSession();
  if (existing) return existing;
  const session: GuestSession = {
    id: `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: Date.now(),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
  return session;
}

/**
 * Discard the guest session and all device-local progress. Called ONLY from
 * the explicit save-or-disregard resolution (E.6) or a future explicit
 * settings affordance — never automatically.
 */
export function endGuestSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    // Progress/artwork keys (lc_guest_progress_v1, lc_guest_artwork_v1) are
    // cleared here too when consumption wiring lands — same lifecycle.
    sessionStorage.removeItem(DISCLOSURE_KEY);
  } catch {}
}

/** D56: the disclosure shows at every guest session start. Browser-session
 * granularity is the honest reading of "session start" for v1. */
export function disclosureSeenThisSession(): boolean {
  try {
    return sessionStorage.getItem(DISCLOSURE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDisclosureSeen() {
  try {
    sessionStorage.setItem(DISCLOSURE_KEY, "1");
  } catch {}
}
