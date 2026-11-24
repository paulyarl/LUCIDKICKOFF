"use client";

import { useState } from "react";
import type { StepSpec } from "../steps/registry";

type InspectorProps<T extends StepSpec> = {
  step: T;
  onChange: (patch: Partial<StepSpec>) => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-brand-navy/60">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm font-normal text-brand-navy"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm font-normal text-brand-navy"
    />
  );
}

function SlideInspector({ step, onChange }: InspectorProps<Extract<StepSpec, { type: "slide" }>>) {
  const guide = step.guide;
  return (
    <div className="space-y-3">
      <Field label="Image URL">
        <TextInput
          value={guide.image ?? ""}
          onChange={(image) => onChange({ guide: { ...guide, image } } as Partial<StepSpec>)}
          placeholder="/art/scene/lesson.01.meet-wildlife-1024.webp"
        />
      </Field>
      <Field label="Slide text">
        <TextArea
          value={guide.text}
          onChange={(text) => onChange({ guide: { ...guide, text } } as Partial<StepSpec>)}
        />
      </Field>
      <Field label="Narration (optional)">
        <TextArea
          value={guide.narration ?? ""}
          onChange={(narration) => onChange({ guide: { ...guide, narration } } as Partial<StepSpec>)}
        />
      </Field>
    </div>
  );
}

function MatchInspector({ step, onChange }: InspectorProps<Extract<StepSpec, { type: "match-pairs" }>>) {
  const guide = step.guide;
  const patch = (next: Partial<typeof guide>) =>
    onChange({ guide: { ...guide, ...next } } as Partial<StepSpec>);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-bold text-brand-navy/60">Items</p>
        {guide.items.map((item, index) => (
          <div key={item.id} className="flex gap-2">
            <TextInput
              value={item.label}
              onChange={(label) =>
                patch({ items: guide.items.map((x, i) => (i === index ? { ...x, label } : x)) })
              }
            />
            <button
              onClick={() => {
                const answers = { ...guide.answers };
                delete answers[item.id];
                patch({ items: guide.items.filter((_, i) => i !== index), answers });
              }}
              className="rounded-lg px-2 text-brand-coral"
              aria-label="Remove item"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => patch({ items: [...guide.items, { id: `item_${Date.now()}`, label: "New item" }] })}
          className="text-xs font-bold text-brand-teal"
        >
          + Add item
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-brand-navy/60">Targets</p>
        {guide.targets.map((target, index) => (
          <div key={target.id} className="flex gap-2">
            <TextInput
              value={target.label}
              onChange={(label) =>
                patch({ targets: guide.targets.map((x, i) => (i === index ? { ...x, label } : x)) })
              }
            />
            <button
              onClick={() => patch({ targets: guide.targets.filter((_, i) => i !== index) })}
              className="rounded-lg px-2 text-brand-coral"
              aria-label="Remove target"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => patch({ targets: [...guide.targets, { id: `target_${Date.now()}`, label: "New target" }] })}
          className="text-xs font-bold text-brand-teal"
        >
          + Add target
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-brand-navy/60">Answers</p>
        {guide.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="w-28 truncate font-semibold">{item.label}</span>
            <select
              value={guide.answers[item.id] ?? ""}
              onChange={(event) => patch({ answers: { ...guide.answers, [item.id]: event.target.value } })}
              className="flex-1 rounded-xl border border-brand-navy/15 bg-white px-2 py-2 text-sm text-brand-navy"
            >
              <option value="">Choose target</option>
              {guide.targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckInspector({ step, onChange }: InspectorProps<Extract<StepSpec, { type: "knowledge-check" }>>) {
  const questions = step.guide.questions;
  const patch = (next: typeof questions) => onChange({ guide: { ...step.guide, questions: next } } as Partial<StepSpec>);

  return (
    <div className="space-y-4">
      {questions.map((question, questionIndex) => (
        <div key={questionIndex} className="space-y-2 rounded-card border border-brand-navy/10 p-3">
          <TextArea
            value={question.prompt}
            onChange={(prompt) =>
              patch(questions.map((q, i) => (i === questionIndex ? { ...q, prompt } : q)))
            }
          />
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <input
                type="radio"
                checked={option.correct}
                onChange={() =>
                  patch(
                    questions.map((q, i) =>
                      i === questionIndex
                        ? { ...q, options: q.options.map((o, j) => ({ ...o, correct: j === optionIndex })) }
                        : q,
                    ),
                  )
                }
              />
              <TextInput
                value={option.label}
                onChange={(label) =>
                  patch(
                    questions.map((q, i) =>
                      i === questionIndex
                        ? { ...q, options: q.options.map((o, j) => (j === optionIndex ? { ...o, label } : o)) }
                        : q,
                    ),
                  )
                }
              />
              <button
                onClick={() =>
                  patch(
                    questions.map((q, i) =>
                      i === questionIndex ? { ...q, options: q.options.filter((_, j) => j !== optionIndex) } : q,
                    ),
                  )
                }
                className="text-brand-coral"
                aria-label="Remove option"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex gap-3">
            <button
              onClick={() =>
                patch(
                  questions.map((q, i) =>
                    i === questionIndex ? { ...q, options: [...q.options, { label: "New option", correct: false }] } : q,
                  ),
                )
              }
              className="text-xs font-bold text-brand-teal"
            >
              + Option
            </button>
            <button
              onClick={() => patch(questions.filter((_, i) => i !== questionIndex))}
              className="text-xs font-bold text-brand-coral"
            >
              Remove question
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          patch([
            ...questions,
            {
              prompt: "New question",
              options: [
                { label: "Option A", correct: true },
                { label: "Option B", correct: false },
              ],
            },
          ])
        }
        className="text-xs font-bold text-brand-teal"
      >
        + Add question
      </button>
    </div>
  );
}

function RewardInspector({ step, onChange }: InspectorProps<Extract<StepSpec, { type: "reward" }>>) {
  return (
    <div className="space-y-3">
      <Field label="Checklist (one per line)">
        <TextArea
          value={step.guide.items.join("\n")}
          onChange={(value) =>
            onChange({
              guide: { ...step.guide, items: value.split("\n").filter((line) => line.trim()) },
            } as Partial<StepSpec>)
          }
          rows={5}
        />
      </Field>
      <Field label="Badge id (optional)">
        <TextInput
          value={step.guide.badge ?? ""}
          onChange={(badge) => onChange({ guide: { ...step.guide, badge } } as Partial<StepSpec>)}
          placeholder="badge.first-lesson"
        />
      </Field>
    </div>
  );
}

function JsonFallback({ step, onChange }: { step: StepSpec; onChange: (patch: Partial<StepSpec>) => void }) {
  const [text, setText] = useState(JSON.stringify(step.guide, null, 2));
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Field label="Guide (JSON — canvas capture lands in 1.12)">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => {
            try {
              onChange({ guide: JSON.parse(text) } as Partial<StepSpec>);
              setError(null);
            } catch {
              setError("Invalid JSON");
            }
          }}
          rows={12}
          spellCheck={false}
          className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 font-mono text-xs text-brand-navy"
        />
      </Field>
      {error ? <p className="text-xs font-semibold text-brand-coral">{error}</p> : null}
    </div>
  );
}

export function StepInspector({
  step,
  onChange,
}: {
  step: StepSpec;
  onChange: (patch: Partial<StepSpec>) => void;
}) {
  switch (step.type) {
    case "slide":
      return <SlideInspector step={step} onChange={onChange} />;
    case "match-pairs":
      return <MatchInspector step={step} onChange={onChange} />;
    case "knowledge-check":
      return <CheckInspector step={step} onChange={onChange} />;
    case "reward":
      return <RewardInspector step={step} onChange={onChange} />;
    default:
      return <JsonFallback key={step.id} step={step} onChange={onChange} />;
  }
}
