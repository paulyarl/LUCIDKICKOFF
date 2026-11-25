"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { Check, Lightbulb, Lock, Palette, Play, RotateCcw, Star, Volume2, VolumeX } from "lucide-react";
import { LessonRunner } from "@/components/learning/LessonRunner";
import { StepMedia, resolveArtRef } from "@/components/learn/StepMedia";
import type { StepSpec, StepType } from "./registry";

export type StepResult = { passed: boolean; stars: number };
export type StepProps<T extends StepSpec = StepSpec> = {
  step: T;
  onComplete: (result: StepResult) => void;
  /** Ordered results of earlier steps — RewardStep maps checklist items to them. */
  results?: StepResult[];
  /** Study & Color chain (2.9): when set, reward/completion offers a coloring CTA. */
  colorHref?: string;
  onExit?: () => void;
};

type SlideSpec = Extract<StepSpec, { type: "slide" }>;
type MatchSpec = Extract<StepSpec, { type: "match-pairs" }>;
type CheckSpec = Extract<StepSpec, { type: "knowledge-check" }>;
type RewardSpec = Extract<StepSpec, { type: "reward" }>;
type CanvasSpec = Extract<StepSpec, { type: "stroke-path" | "area-fill" | "dot-to-dot" | "layer-order" }>;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-panel bg-white p-6 shadow-soft">
      {children}
    </div>
  );
}

export function SlideStep({ step, onComplete }: StepProps<SlideSpec>) {
  const [muted, setMuted] = useState(false);
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (muted) return;
    const utterance = new SpeechSynthesisUtterance(step.guide.narration ?? step.guide.text);
    utterance.lang = document.documentElement.lang || "en";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Shell>
      <div className="space-y-4">
        {step.guide.image ? (
          <StepMedia src={step.guide.image} alt={step.title} className="h-64 w-full rounded-card object-cover" />
        ) : null}
        <h2 className="font-heading text-2xl font-bold text-brand-navy">{step.title}</h2>
        <p className="text-brand-navy/75">{step.guide.text}</p>
        {step.guide.tapTarget ? (
          <div className="rounded-card bg-brand-teal/10 p-3 text-sm font-semibold text-brand-navy">
            Try it: {step.guide.tapTarget.prompt}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            onClick={speak}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white"
          >
            <Volume2 className="h-4 w-4" /> Listen
          </button>
          <button
            onClick={() =>
              setMuted((m) => {
                const next = !m;
                if (next && typeof window !== "undefined") window.speechSynthesis.cancel();
                return next;
              })
            }
            aria-label={muted ? "Unmute narration" : "Mute narration"}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 px-3 py-2 text-sm font-semibold text-brand-navy/70"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onComplete({ passed: true, stars: 0 })}
            className="ml-auto rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </Shell>
  );
}

export function MatchPairsStep({ step, onComplete }: StepProps<MatchSpec>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; label: string; x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const allAssigned = step.guide.items.every((item) => assignments[item.id]);
  const correct = useMemo(
    () => step.guide.items.every((item) => assignments[item.id] === step.guide.answers[item.id]),
    [assignments, step.guide.answers, step.guide.items],
  );

  const assign = (targetId: string) => {
    if (!selected) return;
    setAssignments((prev) => ({ ...prev, [selected]: targetId }));
    setSelected(null);
  };

  return (
    <Shell>
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-brand-navy">{step.title}</h2>
        <p className="text-sm text-brand-navy/60">Drag an animal to its habitat, or select then tap.</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {step.guide.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                aria-pressed={selected === item.id}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDragging({ id: item.id, label: item.label, x: event.clientX, y: event.clientY });
                }}
                onPointerMove={(event) => {
                  if (!dragging) return;
                  setDragging({ ...dragging, x: event.clientX, y: event.clientY });
                  const target = document
                    .elementFromPoint(event.clientX, event.clientY)
                    ?.closest("[data-target-id]");
                  setDragOver(target?.getAttribute("data-target-id") ?? null);
                }}
                onPointerUp={(event) => {
                  if (dragging) {
                    const target = document
                      .elementFromPoint(event.clientX, event.clientY)
                      ?.closest("[data-target-id]");
                    const targetId = target?.getAttribute("data-target-id");
                    if (targetId) {
                      setAssignments((prev) => ({ ...prev, [dragging.id]: targetId }));
                    }
                  }
                  setDragging(null);
                  setDragOver(null);
                }}
                onPointerCancel={() => {
                  setDragging(null);
                  setDragOver(null);
                }}
                style={{ touchAction: "none" }}
                className={`flex w-full items-center gap-3 rounded-card border p-3 text-left ${
                  selected === item.id ? "border-brand-teal bg-brand-teal/10" : "border-brand-navy/10"
                }`}
              >
                {item.image ? <StepMedia src={item.image} alt={item.label} sizes="40px" className="h-10 w-10 rounded-lg object-cover" /> : null}
                <span className="text-sm font-semibold">{item.label}</span>
                {assignments[item.id] ? (
                  <Check className="ml-auto h-4 w-4 text-brand-teal" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {step.guide.targets.map((target) => (
              <button
                key={target.id}
                data-target-id={target.id}
                onClick={() => assign(target.id)}
                className={`w-full rounded-card border-2 border-dashed p-3 text-sm font-semibold ${
                  dragOver === target.id
                    ? "border-brand-teal bg-brand-teal/10 text-brand-navy"
                    : "border-brand-navy/20 text-brand-navy/70"
                }`}
              >
                {target.label}
                {Object.entries(assignments)
                  .filter(([, targetId]) => targetId === target.id)
                  .map(([itemId]) => (
                    <span key={itemId} className="ml-2 rounded-full bg-brand-teal/15 px-2 py-0.5 text-[11px] text-brand-teal">
                      {step.guide.items.find((i) => i.id === itemId)?.label}
                    </span>
                  ))}
              </button>
            ))}
          </div>
        </div>

        {checked ? (
          <div className={`rounded-card p-3 text-sm font-semibold ${correct ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-coral/15 text-brand-coral"}`}>
            {correct ? "All matched correctly." : "Not quite — try again."}
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setChecked(true);
              if (correct) onComplete({ passed: true, stars: 3 });
            }}
            disabled={!allAssigned}
            className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Check my answers
          </button>
          <button
            onClick={() => {
              setAssignments({});
              setChecked(false);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 px-3 py-2 text-sm font-semibold text-brand-navy/70"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {dragging ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-card bg-white px-3 py-2 text-sm font-bold text-brand-navy shadow-soft"
          style={{ left: dragging.x, top: dragging.y }}
        >
          {dragging.label}
        </div>
      ) : null}
    </Shell>
  );
}

export function KnowledgeCheckStep({ step, onComplete }: StepProps<CheckSpec>) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const question = step.guide.questions[index];
  const answered = selected !== null;
  const isCorrect = answered && question.options[selected]?.correct;

  const next = () => {
    const totalCorrect = correctCount + (isCorrect ? 1 : 0);
    if (index + 1 < step.guide.questions.length) {
      setCorrectCount(totalCorrect);
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      const total = step.guide.questions.length;
      onComplete({ passed: totalCorrect === total, stars: totalCorrect });
    }
  };

  return (
    <Shell>
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-brand-navy">{step.title}</h2>
        <p className="text-xs font-semibold text-brand-navy/50">
          Question {index + 1} of {step.guide.questions.length}
        </p>
        {question.image ? (
          <StepMedia src={question.image} alt={question.prompt} className="h-40 w-full rounded-card object-cover" />
        ) : null}
        <p className="text-lg font-semibold text-brand-navy">{question.prompt}</p>
        <div className="space-y-2">
          {question.options.map((option, optionIndex) => (
            <button
              key={option.label}
              onClick={() => setSelected(optionIndex)}
              disabled={answered}
              className={`w-full rounded-card border p-3 text-left text-sm font-semibold ${
                selected === optionIndex ? "border-brand-teal bg-brand-teal/10" : "border-brand-navy/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {answered ? (
          <div className={`rounded-card p-3 text-sm font-semibold ${isCorrect ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-coral/15 text-brand-coral"}`}>
            {isCorrect ? "That's right!" : "Not quite."}
            {!isCorrect && step.hints?.[0] ? (
              <span className="mt-1 flex items-start gap-1 text-brand-navy/60">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5" /> {step.hints[0].text}
              </span>
            ) : null}
          </div>
        ) : null}

        <button
          onClick={next}
          disabled={!answered}
          className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {index + 1 < step.guide.questions.length ? "Next question" : "Finish check"}
        </button>
      </div>
    </Shell>
  );
}

export function RewardStep({ step, onComplete, results, colorHref }: StepProps<RewardSpec>) {
  // S2.4 — checklist from real progress: item i mirrors step i's result.
  // When results aren't provided (authoring preview), everything reads done.
  const itemDone = (i: number) => (results ? (results[i]?.passed ?? false) : true);
  return (
    <Shell>
      <div className="space-y-4 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-ochre/20">
          <Star className="h-8 w-8 fill-brand-ochre text-brand-ochre" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-brand-navy">{step.title}</h2>
        <ul className="mx-auto max-w-sm space-y-2 text-left">
          {step.guide.items.map((item, i) => {
            const ok = itemDone(i);
            return (
              <li
                key={item}
                className={`flex items-center gap-2 rounded-card p-2 text-sm font-semibold ${
                  ok ? 'bg-brand-teal/10' : 'bg-brand-navy/5 text-brand-navy/40'
                }`}
              >
                {ok ? (
                  <Check className="h-4 w-4 text-brand-teal" />
                ) : (
                  <span className="grid h-4 w-4 place-items-center rounded-full border border-brand-navy/25" />
                )}
                {item}
              </li>
            );
          })}
        </ul>
        {(() => {
          const badge = resolveArtRef(step.guide.badge);
          return badge ? (
            <StepMedia src={badge.src} alt="Badge earned" sizes="96px" className="mx-auto h-24 w-24 object-contain" />
          ) : null;
        })()}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onComplete({ passed: true, stars: 3 })}
            className="rounded-xl bg-brand-coral px-5 py-2 text-sm font-bold text-white"
          >
            Next lesson
          </button>
          {colorHref ? (
            <Link
              href={colorHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-teal/40 px-4 py-2 text-sm font-bold text-brand-teal"
            >
              <Palette className="h-4 w-4" /> Color the picture
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

export function CanvasStep({ step, onComplete, onExit }: StepProps<CanvasSpec>) {
  return (
    <LessonRunner
      step={step as any}
      onStepComplete={(success: boolean, stars: number) => onComplete({ passed: success, stars })}
      onSkip={onExit}
      canSkip
    />
  );
}

export const STEP_RENDERERS: Record<StepType, ComponentType<StepProps<any>>> = {
  slide: SlideStep,
  "match-pairs": MatchPairsStep,
  "knowledge-check": KnowledgeCheckStep,
  reward: RewardStep,
  "stroke-path": CanvasStep,
  "area-fill": CanvasStep,
  "dot-to-dot": CanvasStep,
  "layer-order": CanvasStep,
};

export function StepRenderer(props: StepProps) {
  const Component = STEP_RENDERERS[props.step.type];
  return <Component {...(props as StepProps<any>)} />;
}
