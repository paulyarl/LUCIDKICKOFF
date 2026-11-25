"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startGuestSession, disclosureSeenThisSession, markDisclosureSeen } from "@/lib/guest/session";

/**
 * E.5 — Start Exploring with the D56 entry-point disclosure: temporary-nature
 * warning + both ramps (log in / create account), dismissible and
 * non-blocking, copy child-legible.
 */
export function StartExploring() {
  const router = useRouter();
  const [showDisclosure, setShowDisclosure] = useState(false);

  const enter = () => {
    startGuestSession();
    router.push("/frame/home"); // interim — S2 consumption wiring retargets the exploring flow
  };

  const handleClick = () => {
    if (disclosureSeenThisSession()) {
      enter();
    } else {
      setShowDisclosure(true);
    }
  };

  const dismiss = () => {
    markDisclosureSeen();
    setShowDisclosure(false);
    enter();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center justify-center rounded-2xl bg-brand-teal px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:bg-brand-teal/90"
      >
        Start Exploring
      </button>

      {showDisclosure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-brand-teal/20 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-brand-navy">Just so you know</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-brand-navy/80">
              You&apos;re exploring as a guest. Everything you make stays on this tablet — if it&apos;s
              deleted here, it&apos;s gone forever.
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-brand-navy/80">
              A grown-up can save your artwork and keep it safe with a family account.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={dismiss}
                className="w-full rounded-2xl bg-brand-teal px-6 py-3 text-base font-bold text-white transition hover:bg-brand-teal/90"
              >
                Keep Exploring
              </button>
              <div className="flex gap-2">
                <Link
                  href="/auth/login?role=parent"
                  className="flex-1 rounded-2xl border-2 border-brand-navy/20 px-4 py-2.5 text-center text-sm font-bold text-brand-navy transition hover:border-brand-navy/40"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup?role=parent"
                  className="flex-1 rounded-2xl border-2 border-brand-coral/40 px-4 py-2.5 text-center text-sm font-bold text-brand-coral transition hover:border-brand-coral"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
