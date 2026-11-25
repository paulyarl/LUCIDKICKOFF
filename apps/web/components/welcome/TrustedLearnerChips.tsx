"use client";

import { useEffect, useState } from "react";
import { syncVerifiers, verifyPinOffline, setActiveChildOffline, getCachedLearners } from "@/lib/auth/offline-pin";
import { useI18n } from "@/lib/i18n/provider";

type Learner = {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  hasPin: boolean;
};

/**
 * E.4 — trusted-device welcome variant (D58). On a trusted device the family's
 * learner chips surface directly in the welcome hub; tapping a chip prompts
 * for the PIN inline and cold-starts the child session. Untrusted devices
 * render nothing — the hub CTAs carry the page alone.
 */
export function TrustedLearnerChips() {
  const { t } = useI18n();
  const [learners, setLearners] = useState<Learner[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/learners");
        const json = await res.json();
        if (json.trusted) syncVerifiers(json.learners ?? []);
        if (mounted && json.trusted && Array.isArray(json.learners) && json.learners.length > 0) {
          setLearners(json.learners);
        }
      } catch {
        // E.3 — offline: fall back to the cached replica so chips still render.
        const cached = getCachedLearners();
        if (mounted && cached.length > 0) setLearners(cached);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!learners) return null;

  const start = async (learnerId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/learners/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_profile_id: learnerId, pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("welcome.error.couldNotStart"));
      window.location.href = json.redirect ?? "/child";
    } catch (err) {
      // E.3 — network failure means possible offline: try the cached verifier.
      if (err instanceof TypeError) {
        const learner = learners?.find((l) => l.id === learnerId);
        const result = await verifyPinOffline(learnerId, pin);
        if (result.ok) {
          setActiveChildOffline({ id: learnerId, nickname: learner?.nickname ?? null, avatarUrl: learner?.avatarUrl ?? null });
          window.location.href = "/child";
          return;
        }
        setError(result.error);
      } else {
        setError(err instanceof Error ? err.message : t("welcome.error.couldNotStart"));
      }
      setBusy(false);
    }
  };

  const active = learners.find((l) => l.id === activeId);

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">
        {t("welcome.whoIsPlaying")}
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-center gap-4">
        {learners.map((learner) => {
          const isActive = learner.id === activeId;
          return (
            <div key={learner.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  setActiveId(isActive ? null : learner.id);
                  setPin("");
                  setError(null);
                }}
                className={`grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 bg-white shadow-soft transition ${
                  isActive ? "border-brand-teal" : "border-transparent hover:border-brand-teal/40"
                }`}
                aria-label={t("welcome.playAs", { name: learner.nickname ?? t("welcome.learnerFallback") })}
              >
                {learner.avatarUrl ? (
                  <img src={learner.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-heading text-xl font-bold text-brand-teal">
                    {(learner.nickname ?? "?").slice(0, 1)}
                  </span>
                )}
              </button>
              <span className="text-xs font-semibold text-brand-navy/70">
                {learner.nickname ?? t("welcome.learnerFallback")}
              </span>
            </div>
          );
        })}
      </div>

      {active ? (
        <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
          <input
            inputMode="numeric"
            type="password"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder={t("welcome.pinPlaceholder")}
            aria-label={t("welcome.pinAria", { name: active.nickname ?? t("welcome.learnerFallback") })}
            className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-center text-sm text-brand-navy"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !busy) void start(active.id);
            }}
          />
          <button
            onClick={() => void start(active.id)}
            disabled={busy || pin.length < 4}
            className="shrink-0 rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "…" : t("welcome.go")}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs font-semibold text-brand-coral">{error}</p> : null}
    </div>
  );
}
