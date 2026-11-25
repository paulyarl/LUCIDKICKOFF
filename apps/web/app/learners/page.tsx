"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listChildren, type FamilyChild } from "@/lib/family";
import { useAuth } from "@/lib/auth/use-auth";

export default function LearnersPage() {
  const { user } = useAuth();
  const role = (user?.app_metadata as any)?.role;
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listChildren();
        if (mounted) setChildren(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load learners");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ageOf = (birthdate?: string | null) =>
    birthdate
      ? Math.floor((Date.now() - new Date(birthdate).getTime()) / 31557600000)
      : null;

  if (!user) {
    return (
      <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
        <div className="mx-auto max-w-md space-y-3 text-center">
          <h1 className="font-heading text-2xl font-bold">Choose a learner</h1>
          <p className="text-sm text-brand-navy/60">Sign in with a guardian account to switch learners.</p>
          <Link href="/auth/login" className="inline-block rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const switchTo = async (childProfileId: string) => {
    setSwitching(childProfileId);
    setSwitchError(null);
    try {
      const res = await fetch("/api/learners/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_profile_id: childProfileId,
          pin: pins[childProfileId] ?? "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not switch learner");
      window.location.href = json.redirect ?? "/child";
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : "Could not switch learner");
      setSwitching(null);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Choose a learner</h1>
          <p className="text-sm text-brand-navy/60">
            Pick a learner profile to continue, or create a new one for your child.
          </p>
        </div>

        {loading ? <p className="text-sm text-brand-navy/50">Loading learners…</p> : null}
        {error ? <p className="text-sm font-semibold text-brand-coral">{error}</p> : null}
        {switchError ? <p className="text-sm font-semibold text-brand-coral">{switchError}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const age = ageOf(child.birthdate);
              return (
                <div key={child.id} className="rounded-panel bg-white p-4 text-center shadow-soft">
                  {child.avatarUrl ? (
                    <img
                      src={child.avatarUrl}
                      alt=""
                      className="mx-auto h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-brand-teal/15 font-heading text-2xl font-bold">
                      {child.email.slice(0, 1)}
                    </div>
                  )}
                  <h2 className="mt-3 font-heading text-lg font-bold">{child.email}</h2>
                  {age !== null ? <p className="text-xs text-brand-navy/50">Age {age}</p> : null}
                  {role === "child" ? (
                    <div className="mt-3 space-y-2">
                      <input
                        inputMode="numeric"
                        maxLength={6}
                        value={pins[child.childProfileId] ?? ""}
                        onChange={(event) =>
                          setPins((prev) => ({ ...prev, [child.childProfileId]: event.target.value }))
                        }
                        placeholder="4–6 digit PIN"
                        className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-center text-sm text-brand-navy"
                      />
                      <button
                        onClick={() => void switchTo(child.childProfileId)}
                        disabled={switching === child.childProfileId}
                        className="w-full rounded-xl bg-brand-coral px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {switching === child.childProfileId ? "Switching…" : "Continue"}
                      </button>
                    </div>
                  ) : (
                    <form action="/parent/impersonate" method="post" className="mt-3">
                      <input type="hidden" name="childId" value={child.id} />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-brand-coral px-3 py-2 text-xs font-bold text-white"
                      >
                        Continue
                      </button>
                    </form>
                  )}
                </div>
              );
            })}

            <Link
              href="/parent/children/new"
              className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed border-brand-navy/20 bg-white/60 p-4 text-sm font-semibold text-brand-navy/50"
            >
              <span className="text-3xl">+</span>
              Create learner profile
            </Link>
          </div>
        ) : null}

        <p className="text-xs text-brand-navy/45">
          Children switch with their 4–6 digit PIN; guardians switch with an active guardian session. Five failed attempts lock the PIN for 15 minutes.
        </p>
      </div>
    </main>
  );
}
