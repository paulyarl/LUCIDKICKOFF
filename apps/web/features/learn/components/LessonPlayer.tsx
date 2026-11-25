"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Cloud, CloudOff, Palette, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { StepRenderer, type StepResult } from "@/features/learn/steps";
import type { StepSpec } from "@/features/learn/steps/registry";

type ProgressSnapshot = {
  stepIndex: number;
  results: StepResult[];
  done: boolean;
  updatedAt: number;
};

const stars = (results: StepResult[]) => results.reduce((total, r) => total + r.stars, 0);
const passed = (results: StepResult[]) => results.filter((r) => r.passed).length;

function storageKey(learnerKey: string, lessonId: string) {
  return `lc-progress:${learnerKey}:${lessonId}`;
}

function readLocal(key: string): ProgressSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ProgressSnapshot) : null;
  } catch {
    return null;
  }
}

export function LessonPlayer({
  lessonId,
  title,
  steps,
  learnerKey,
  serverProgress,
  backHref,
  thenColorHref,
}: {
  lessonId: string;
  title: string;
  steps: StepSpec[];
  /** Stable identity scope for progress: child profile id or auth user id. */
  learnerKey: string;
  serverProgress: { stepIndex: number; stars: number; passedSteps: number } | null;
  backHref: string;
  /** Study & Color chain (2.9) — completion screen offers the coloring CTA. */
  thenColorHref?: string;
}) {
  const key = useMemo(() => storageKey(learnerKey, lessonId), [learnerKey, lessonId]);

  const [index, setIndex] = useState(() =>
    Math.min(Math.max(serverProgress?.stepIndex ?? 0, 0), steps.length),
  );
  const [results, setResults] = useState<StepResult[]>([]);
  const [done, setDone] = useState(
    () => steps.length > 0 && (serverProgress?.stepIndex ?? 0) >= steps.length,
  );
  const [syncState, setSyncState] = useState<"idle" | "local" | "synced" | "offline">("idle");
  const hydrated = useRef(false);

  // S2.2/2.3 — resume: whichever of local/server is further ahead wins.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const local = readLocal(key);
    if (!local) return;
    if (local.stepIndex > (serverProgress?.stepIndex ?? 0)) {
      setIndex(Math.min(local.stepIndex, steps.length));
      setResults(Array.isArray(local.results) ? local.results : []);
      setDone(local.done);
      setSyncState("local");
    }
  }, [key, serverProgress, steps.length]);

  const persist = (snapshot: ProgressSnapshot) => {
    try {
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // storage full/unavailable — still attempt the server write
    }
    setSyncState("local");
    fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepIndex: snapshot.stepIndex,
        stars: stars(snapshot.results),
        passedSteps: passed(snapshot.results),
      }),
    })
      .then((res) => setSyncState(res.ok ? "synced" : "offline"))
      .catch(() => setSyncState("offline"));
  };

  const restart = () => {
    setIndex(0);
    setResults([]);
    setDone(false);
    persist({ stepIndex: 0, results: [], done: false, updatedAt: Date.now() });
  };

  if (steps.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-panel bg-white p-8 text-center shadow-soft">
        <p className="font-heading text-lg font-bold text-brand-navy">Nothing to play yet</p>
        <p className="mt-1 text-sm text-brand-navy/60">This lesson has no published steps.</p>
        <Link href={backHref} className="mt-4 inline-block rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white">
          Back
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-panel bg-white p-8 text-center shadow-soft">
        <h2 className="font-heading text-2xl font-bold text-brand-navy">Lesson complete</h2>
        <p className="text-sm text-brand-navy/60">
          {title} — {passed(results)} of {steps.length} steps passed · {stars(results)} stars
        </p>
        {thenColorHref ? (
          <div className="rounded-card bg-brand-teal/10 p-4">
            <p className="mb-3 text-sm font-semibold text-brand-navy">
              You finished the lesson — now color the picture!
            </p>
            <Link
              href={thenColorHref}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-bold text-white"
            >
              <Palette className="h-4 w-4" /> Start coloring
            </Link>
          </div>
        ) : null}
        <div className="flex justify-center gap-2">
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white"
          >
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy/70"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const percent = Math.round((index / steps.length) * 100);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-3 rounded-card bg-white p-3 shadow-soft">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-navy/50">
            Step {index + 1} of {steps.length}
          </p>
          <p className="truncate font-heading text-sm font-bold text-brand-navy">{step.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
              syncState === "synced"
                ? "bg-brand-teal/10 text-brand-teal"
                : syncState === "local"
                  ? "bg-brand-ochre/15 text-brand-ochre"
                  : "bg-brand-navy/5 text-brand-navy/40"
            }`}
          >
            {syncState === "synced" ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
            {syncState === "synced" ? "Synced" : syncState === "offline" ? "Offline" : "Saved locally"}
          </span>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-navy/60 hover:bg-brand-navy/5"
          >
            <X className="h-4 w-4" /> Exit
          </Link>
        </div>
      </header>

      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-navy/10">
        <div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${percent}%` }} />
      </div>

      <div className="force-light">
        <StepRenderer
          key={step.id}
          step={step}
          results={results}
          colorHref={thenColorHref}
          onComplete={(result) => {
            const next = [...results, result];
            setResults(next);
            const nextIndex = index + 1;
            const snapshot: ProgressSnapshot = {
              stepIndex: nextIndex,
              results: next,
              done: nextIndex >= steps.length,
              updatedAt: Date.now(),
            };
            persist(snapshot);
            if (nextIndex < steps.length) setIndex(nextIndex);
            else setDone(true);
          }}
        />
      </div>
    </div>
  );
}
