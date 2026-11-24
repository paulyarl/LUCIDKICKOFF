"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { StepRenderer, type StepResult } from "@/features/learn/steps";
import type { StepSpec } from "@/features/learn/steps/registry";

export function LessonPreview({
  steps,
  onExit,
}: {
  steps: StepSpec[];
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [done, setDone] = useState(false);

  if (steps.length === 0) {
    return (
      <div className="rounded-card bg-white p-6 text-center shadow-soft">
        <p className="text-sm text-brand-navy/60">Add at least one step to preview.</p>
        <button onClick={onExit} className="mt-3 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white">
          Back to editor
        </button>
      </div>
    );
  }

  const restart = () => {
    setIndex(0);
    setResults([]);
    setDone(false);
  };

  if (done) {
    const passed = results.filter((result) => result.passed).length;
    const stars = results.reduce((total, result) => total + result.stars, 0);
    return (
      <div className="space-y-4 rounded-panel bg-white p-8 text-center shadow-soft">
        <h2 className="font-heading text-2xl font-bold text-brand-navy">Preview complete</h2>
        <p className="text-sm text-brand-navy/60">
          {passed} of {steps.length} steps passed · {stars} stars
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white"
          >
            <RotateCcw className="h-4 w-4" /> Run again
          </button>
          <button onClick={onExit} className="rounded-xl border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy/70">
            Back to editor
          </button>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const percent = Math.round((index / steps.length) * 100);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between rounded-card bg-white p-3 shadow-soft">
        <div>
          <p className="text-xs font-semibold text-brand-navy/50">
            Lesson preview · step {index + 1} of {steps.length}
          </p>
          <p className="font-heading text-sm font-bold text-brand-navy">{step.title}</p>
        </div>
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-navy/60 hover:bg-brand-navy/5"
        >
          <X className="h-4 w-4" /> Exit
        </button>
      </header>

      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-navy/10">
        <div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${percent}%` }} />
      </div>

      <StepRenderer
        key={step.id}
        step={step}
        onComplete={(result) => {
          const next = [...results, result];
          setResults(next);
          if (index + 1 < steps.length) setIndex(index + 1);
          else setDone(true);
        }}
      />
    </div>
  );
}
