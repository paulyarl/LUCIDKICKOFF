"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  guestNeedsResolution,
  resolveGuestAsSaved,
  resolveGuestAsDisregarded,
} from "@/lib/guest/session";

/**
 * E.6 — the one-time save-or-disregard prompt (D56). Shown exactly once per
 * guest session, at the first authenticated sign-in/sign-up that follows it.
 * Never re-prompts after a choice is recorded.
 *
 * "Save" parks the device-local guest data untouched; migration into a family
 * child profile completes automatically once the Sprint 2 progress schema
 * lands (sprint-spec E.6 option A). "Disregard" discards it — destructive,
 * so it takes a confirming second tap.
 */
export function GuestMigrationPrompt() {
  const { user, sessionReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => {
    if (sessionReady && user && guestNeedsResolution()) {
      setOpen(true);
    }
  }, [sessionReady, user]);

  if (!open) return null;

  const handleSave = () => {
    resolveGuestAsSaved();
    setOpen(false);
  };

  const handleDisregard = () => {
    if (!confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    resolveGuestAsDisregarded();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-navy/40 p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-brand-ochre/30 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-extrabold text-brand-navy">
          You have guest artwork on this tablet
        </h2>
        <p className="mt-3 text-sm font-medium leading-relaxed text-brand-navy/80">
          Before you signed in, someone was exploring as a guest on this device. Would you like to
          save that progress and artwork, or disregard it?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="w-full rounded-2xl bg-brand-teal px-6 py-3 text-base font-bold text-white transition hover:bg-brand-teal/90"
          >
            Save It
          </button>
          <button
            onClick={handleDisregard}
            className={`w-full rounded-2xl border-2 px-6 py-2.5 text-sm font-bold transition ${
              confirmingDiscard
                ? "border-brand-coral bg-brand-coral text-white"
                : "border-brand-navy/20 text-brand-navy/60 hover:border-brand-coral/50 hover:text-brand-coral"
            }`}
          >
            {confirmingDiscard ? "Tap again to discard it forever" : "Disregard It"}
          </button>
        </div>
      </div>
    </div>
  );
}
