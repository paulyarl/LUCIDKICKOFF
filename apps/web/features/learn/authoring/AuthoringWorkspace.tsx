"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { StepRenderer } from "@/features/learn/steps";
import { StepInspector } from "./inspector";
import {
  createStep,
  parseStep,
  STEP_TYPES,
  type StepSpec,
  type StepType,
} from "@/features/learn/steps/registry";

type LessonRow = {
  id: string;
  title: string;
  status: string;
  visibility: string;
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
  const [steps, setSteps] = useState<StepSpec[]>(initialSteps);
  const [selectedId, setSelectedId] = useState<string | null>(initialSteps[0]?.id ?? null);
  const [addType, setAddType] = useState<StepType>("slide");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  const selected = useMemo(
    () => steps.find((step) => step.id === selectedId) ?? null,
    [selectedId, steps],
  );

  const updateSelected = (patch: Partial<StepSpec>) => {
    if (!selected) return;
    setSteps((prev) =>
      prev.map((step) => (step.id === selected.id ? ({ ...step, ...patch } as StepSpec) : step)),
    );
  };

  const addStep = () => {
    const step = createStep(addType);
    setSteps((prev) => [...prev, step]);
    setSelectedId(step.id);
  };

  const duplicate = () => {
    if (!selected) return;
    const copy = { ...selected, id: `${selected.type}_${Date.now()}` } as StepSpec;
    const index = steps.findIndex((step) => step.id === selected.id);
    setSteps((prev) => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]);
    setSelectedId(copy.id);
  };

  const remove = () => {
    if (!selected) return;
    const remaining = steps.filter((step) => step.id !== selected.id);
    setSteps(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  };

  const move = (direction: -1 | 1) => {
    if (!selected) return;
    const index = steps.findIndex((step) => step.id === selected.id);
    const next = index + direction;
    if (next < 0 || next >= steps.length) return;
    const copy = [...steps];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setSteps(copy);
  };



  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const validated = steps.map((step) => parseStep(step));
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, steps: validated }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3 rounded-card bg-white p-4 shadow-soft">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-[240px] flex-1 rounded-xl border border-brand-navy/15 bg-white px-3 py-2 font-heading text-lg font-bold text-brand-navy"
        />
        <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy/60">
          {lesson.status} · {lesson.visibility}
        </span>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save draft"}
        </button>
        {savedAt ? <span className="text-xs text-brand-teal">Saved {savedAt}</span> : null}
      </header>

      {error ? (
        <div className="flex items-start gap-2 rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="whitespace-pre-wrap">{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr_1fr]">
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
          </ol>

          <div className="space-y-2 border-t border-brand-navy/10 pt-3">
            <select
              value={addType}
              onChange={(event) => setAddType(event.target.value as StepType)}
              className="w-full rounded-xl border border-brand-navy/15 bg-white px-2 py-2 text-xs font-semibold text-brand-navy"
            >
              {STEP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
            <button
              onClick={addStep}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-coral px-3 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Add step
            </button>
          </div>
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
                <button onClick={duplicate} aria-label="Duplicate" className="rounded-lg p-1.5 hover:bg-brand-navy/5">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={remove} aria-label="Delete" className="rounded-lg p-1.5 text-brand-coral hover:bg-brand-coral/10">
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
              <div className="text-xs font-semibold text-brand-navy/60">
                Type
                <div className="mt-1 rounded-xl bg-brand-navy/5 px-3 py-2 text-sm text-brand-navy">
                  {TYPE_LABEL[selected.type]}
                </div>
              </div>
              <StepInspector step={selected} onChange={updateSelected} />
            </div>
          ) : (
            <p className="text-sm text-brand-navy/50">Add a step to start.</p>
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
