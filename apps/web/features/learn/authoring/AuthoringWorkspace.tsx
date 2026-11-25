"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { StepRenderer } from "@/features/learn/steps";
import { StepInspector } from "./inspector";
import { LessonPreview } from "./LessonPreview";
import {
  createStep,
  parseStep,
  stepRegistry,
  STEP_TYPES,
  type StepSpec,
  type StepType,
} from "@/features/learn/steps/registry";

type LessonRow = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  review_note?: string | null;
};

const TYPE_LABEL: Record<StepType, string> = {
  slide: "Slide",
  "match-pairs": "Match pairs",
  "knowledge-check": "Knowledge check",
  reward: "Reward",
  "stroke-path": "Trace path",
  "area-fill": "Area fill",
  "dot-to-dot": "Dot to dot",
  "layer-order": "Layer order",
};


export function AuthoringWorkspace({
  lesson,
  initialSteps,
}: {
  lesson: LessonRow;
  initialSteps: StepSpec[];
}) {
  const [title, setTitle] = useState(lesson.title);
  const [steps, setSteps] = useState<StepSpec[]>(
    initialSteps.map((step) => {
      const clean = { ...step } as Record<string, unknown>;
      for (const key of ["hints", "rubric", "on_success", "constraints"]) {
        if (clean[key] === null) delete clean[key];
      }
      return clean as StepSpec;
    }),
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialSteps[0]?.id ?? null);
  const [addType, setAddType] = useState<StepType>("slide");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [status, setStatus] = useState(lesson.status);
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(false);
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const savingRef = useRef(false);
  const persistRef = useRef<(auto?: boolean) => Promise<boolean>>(async () => false);

  const selected = useMemo(
    () => steps.find((step) => step.id === selectedId) ?? null,
    [selectedId, steps],
  );
  const usedTypes = useMemo<Set<StepType>>(
    () =>
      new Set(
        steps
          .filter((step) => !stepRegistry[step.type].repeatable)
          .map((step) => step.type),
      ),
    [steps],
  );
  const allSingletonsUsed = STEP_TYPES.filter(
    (type) => !stepRegistry[type].repeatable,
  ).every((type) => usedTypes.has(type));

  const updateSelected = (patch: Partial<StepSpec>) => {
    if (!selected) return;
    setSteps((prev) =>
      prev.map((step) => (step.id === selected.id ? ({ ...step, ...patch } as StepSpec) : step)),
    );
  };

  const addStep = (type: StepType = addType) => {
    if (steps.length === 0 && type !== "slide") {
      setError("A lesson must start with a slide.");
      return;
    }
    if (!stepRegistry[type].repeatable) {
      const existing = steps.find((step) => step.type === type);
      if (existing) {
        setSelectedId(existing.id);
        return;
      }
    }
    const step = createStep(type);
    if (stepRegistry[type].repeatable) {
      const count = steps.filter((candidate) => candidate.type === type).length;
      if (count > 0) step.title = `${TYPE_LABEL[type]} ${count + 1}`;
    }
    setSteps((prev) => [...prev, step]);
    setSelectedId(step.id);
  };

  const move = (direction: -1 | 1) => {
    if (!selected) return;
    const index = steps.findIndex((step) => step.id === selected.id);
    const next = index + direction;
    if (next < 0 || next >= steps.length) return;
    const copy = [...steps];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    if (copy[0]?.type !== "slide") {
      setError("A lesson must start with a slide.");
      return;
    }
    setSteps(copy);
  };

  const remove = () => {
    if (!selected) return;
    const remaining = steps.filter((step) => step.id !== selected.id);
    setSteps(remaining);
    setSelectedId(remaining[0]?.id ?? null);
    if (remaining.length === 0) setAddType("slide");
  };

  const persist = async (auto = false): Promise<boolean> => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    if (!auto) setError(null);
    try {
      const validated = steps.map((step, index) => {
        try {
          return parseStep(step);
        } catch (error) {
          const prefix = `Step ${index + 1} of ${steps.length}`;
          throw new Error(`${prefix}: ${error instanceof Error ? error.message : "Invalid step"}`);
        }
      });
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, steps: validated }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSavedAt(new Date().toLocaleTimeString());
      setError(null);
      setAutoNote(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      if (auto) setAutoNote(message);
      else setError(message);
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  persistRef.current = persist;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await persist(false);
      if (!saved) return;
      const res = await fetch(`/api/lessons/${lesson.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submit failed");
      setStatus("pending_review");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persistRef.current(true), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, steps]);

  if (previewLesson) {
    return <LessonPreview steps={steps} onExit={() => setPreviewLesson(false)} />;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3 rounded-card bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-[240px] flex-1 rounded-xl border border-brand-navy/15 bg-white px-3 py-2 font-heading text-lg font-bold text-brand-navy"
          />
          <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy/60">
            {status} · {lesson.visibility}
          </span>
          <button
            onClick={() => setPreviewLesson(true)}
            disabled={steps.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy/70 disabled:opacity-40"
          >
            <Eye className="h-4 w-4" /> Preview lesson
          </button>
          <button
            onClick={() => void persist(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save draft"}
          </button>
          {status === "draft" || status === "rejected" ? (
            <button
              onClick={() => void submit()}
              disabled={submitting || steps.length === 0}
              className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          ) : null}
          <span className="text-xs font-semibold text-brand-navy/45">
            {saving ? "Saving…" : savedAt ? `Saved ${savedAt}` : "Unsaved changes"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-brand-navy/60">Type</span>
          <select
            value={addType}
            onChange={(event) => setAddType(event.target.value as StepType)}
            className="w-full max-w-[220px] rounded-xl border border-brand-navy/15 bg-white px-2 py-2 text-xs font-semibold text-brand-navy"
          >
            {STEP_TYPES.map((type) => (
              <option key={type} value={type} disabled={(steps.length === 0 && type !== "slide") || (!stepRegistry[type].repeatable && usedTypes.has(type))}>
                {TYPE_LABEL[type]}
                {!stepRegistry[type].repeatable && usedTypes.has(type) ? " ✓" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => addStep()}
            disabled={(steps.length === 0 && addType !== "slide") || (!stepRegistry[addType].repeatable && (usedTypes.has(addType) || allSingletonsUsed))}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-coral px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add step
          </button>
          <span className="text-[11px] text-brand-navy/45">
            {steps.length === 0
              ? "Lessons start with a Slide — add one to unlock the other types"
              : "Repeatable types can be added more than once"}
          </span>
        </div>
      </header>

      {autoNote && !error ? (
        <p className="whitespace-pre-wrap text-xs font-semibold text-brand-ochre">
          Autosave paused — {autoNote}
        </p>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="whitespace-pre-wrap">{error}</span>
        </div>
      ) : null}

      {status === "rejected" && lesson.review_note ? (
        <div className="rounded-card bg-brand-coral/10 p-3 text-sm text-brand-navy">
          <p className="font-bold text-brand-coral">Reviewer note</p>
          <p className="mt-1 whitespace-pre-wrap text-brand-navy/75">{lesson.review_note}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_1fr]">
        <aside className="space-y-3 rounded-card bg-white p-3 shadow-soft">
          <h2 className="font-heading text-sm font-bold text-brand-navy">Lesson outline</h2>
          <ol className="space-y-1">
            {steps.map((step, index) => (
              <li key={step.id}>
                <button
                  onClick={() => setSelectedId(step.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold ${
                    step.id === selectedId
                      ? "bg-brand-teal/15 text-brand-navy"
                      : "text-brand-navy/65 hover:bg-brand-navy/5"
                  }`}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-navy/10 text-[10px]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{step.title}</span>
                  <span className="text-[10px] text-brand-navy/40">{TYPE_LABEL[step.type]}</span>
                </button>
              </li>
            ))}
            {STEP_TYPES.filter((type) => !stepRegistry[type].repeatable && !usedTypes.has(type)).length > 0 ? (
              <li className="pt-2 text-[10px] font-bold uppercase tracking-wide text-brand-navy/35">
                Not added
              </li>
            ) : null}
            {STEP_TYPES.filter((type) => !stepRegistry[type].repeatable && !usedTypes.has(type)).map((type) => (
              <li key={type}>
                <button
                  onClick={() => addStep(type)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-brand-navy/35 hover:bg-brand-navy/5"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-navy/5 text-[10px]">+</span>
                  <span className="min-w-0 flex-1 truncate">{TYPE_LABEL[type]}</span>
                  <span className="text-[10px]">Not added</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="space-y-3 rounded-card bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-brand-navy">Inspector</h2>
            {selected ? (
              <div className="flex gap-1">
                <button onClick={() => move(-1)} aria-label="Move up" className="rounded-lg p-1.5 hover:bg-brand-navy/5">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(1)} aria-label="Move down" className="rounded-lg p-1.5 hover:bg-brand-navy/5">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={remove}
                  aria-label="Delete step"
                  className="rounded-lg p-1.5 text-brand-coral hover:bg-brand-coral/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-brand-navy/60">
                Step title
                <input
                  value={selected.title}
                  onChange={(event) => updateSelected({ title: event.target.value } as Partial<StepSpec>)}
                  className="mt-1 w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm font-normal text-brand-navy"
                />
              </label>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-navy/60">
                Type
                <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">
                  {TYPE_LABEL[selected.type]}
                </span>
              </div>
              <StepInspector step={selected} onChange={updateSelected} />
            </div>
          ) : (
            <p className="text-sm text-brand-navy/50">Choose a type above and add a step.</p>
          )}
        </section>

        <section className="space-y-3 rounded-card bg-white p-4 shadow-soft">
          <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-brand-navy">
            <Eye className="h-4 w-4" /> Learner preview
          </h2>
          {selected ? (
            <div className="rounded-card border border-brand-navy/10 bg-brand-cream p-2">
              <StepRenderer
                key={selected.id}
                step={selected}
                onComplete={(result) =>
                  setPreviewResult(
                    result.passed ? `Passed · ${result.stars} stars` : "Not passed — try again",
                  )
                }
              />
            </div>
          ) : (
            <p className="text-sm text-brand-navy/50">Nothing selected.</p>
          )}
          {previewResult ? (
            <p className="text-xs font-semibold text-brand-teal">{previewResult}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
