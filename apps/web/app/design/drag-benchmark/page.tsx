"use client";

import { useRef, useState } from "react";
import { MatchPairsStep } from "@/features/learn/steps";
import type { StepSpec } from "@/features/learn/steps/registry";

const BENCH_STEP: StepSpec = {
  id: "drag-benchmark",
  type: "match-pairs",
  title: "Drag benchmark",
  guide: {
    items: [
      { id: "lion", label: "Lion" },
      { id: "zebra", label: "Zebra" },
      { id: "flamingo", label: "Flamingo" },
      { id: "elephant", label: "Elephant" },
      { id: "giraffe", label: "Giraffe" },
      { id: "hippo", label: "Hippo" },
      { id: "gorilla", label: "Gorilla" },
      { id: "crocodile", label: "Crocodile" },
    ],
    targets: [
      { id: "savanna", label: "savanna" },
      { id: "grassland", label: "grassland" },
      { id: "lake", label: "lake" },
      { id: "woodland", label: "woodland" },
      { id: "acacia", label: "acacia" },
      { id: "river", label: "river" },
      { id: "forest", label: "forest" },
      { id: "wetland", label: "wetland" },
    ],
    answers: {
      lion: "savanna",
      zebra: "grassland",
      flamingo: "lake",
      elephant: "woodland",
      giraffe: "acacia",
      hippo: "river",
      gorilla: "forest",
      crocodile: "wetland",
    },
  },
  hints: [],
};

type Summary = { input: string[]; avg: number; max: number; frames: number };

export default function DragBenchmarkPage() {
  const dragging = useRef(false);
  const loop = useRef<number | null>(null);
  const lastFrame = useRef(0);
  const deltas = useRef<number[]>([]);
  const inputs = useRef<Set<string>>(new Set());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const start = (event: React.PointerEvent) => {
    if (dragging.current) return;
    dragging.current = true;
    inputs.current.add(event.pointerType || "mouse");
    deltas.current = [];
    lastFrame.current = performance.now();
    setSummary(null);
    setResult(null);

    const tick = (now: number) => {
      deltas.current.push(now - lastFrame.current);
      lastFrame.current = now;
      if (dragging.current) loop.current = requestAnimationFrame(tick);
    };
    loop.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (loop.current) cancelAnimationFrame(loop.current);
    loop.current = null;
    const values = deltas.current;
    const avg = values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
    const max = values.length ? Math.round(Math.max(...values)) : 0;
    setSummary({ input: [...inputs.current], avg, max, frames: values.length });
  };

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">In-app drag benchmark</h1>
          <p className="text-sm text-brand-navy/60">
            Runs inside the app render, so touch is available. Drag each animal to its habitat
            and watch the frame-time summary.
          </p>
        </div>

        <div className="rounded-card bg-white p-4 shadow-soft">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-brand-navy/70 sm:grid-cols-4">
            <div>Input: {summary ? summary.input.join(", ") : "—"}</div>
            <div>Avg frame: {summary ? `${summary.avg} ms` : "—"}</div>
            <div>Max frame: {summary ? `${summary.max} ms` : "—"}</div>
            <div>Frames: {summary ? summary.frames : "—"}</div>
          </div>
          <button
            onClick={() => {
              setSummary(null);
              setResult(null);
              inputs.current = new Set();
            }}
            className="mt-2 rounded-lg bg-brand-navy/5 px-3 py-1 text-xs font-bold text-brand-navy/60"
          >
            Reset metrics
          </button>
        </div>

        <div
          onPointerDownCapture={start}
          onPointerUpCapture={stop}
          onPointerCancelCapture={stop}
        >
          <MatchPairsStep
            step={BENCH_STEP as any}
            onComplete={(value) =>
              setResult(value.passed ? "Completed — all matched" : "Not passed")
            }
          />
        </div>

        {result ? <p className="text-sm font-semibold text-brand-teal">{result}</p> : null}
      </div>
    </main>
  );
}
