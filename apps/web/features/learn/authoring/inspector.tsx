"use client";

import { useRef, useState } from "react";
import { Eraser, Eye, EyeOff, Undo2 } from "lucide-react";
import type { StepSpec } from "../steps/registry";
import {
  getOverlayDisplay,
  overlayPreserveAspectRatio,
  OVERLAY_FITS,
  type OverlayFit,
  type OverlayGuide,
} from "../overlay";
import { MediaPicker } from "./MediaPicker";
import { clampDotPoint, stripLegacyOriginSentinels, type CanvasPoint } from "../points";

/** Matches the learner canvas (CanvasEngine renders at 800x600). */
const CANVAS_W = 800;
const CANVAS_H = 600;

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
      <Field label="Image">
        <MediaPicker
          value={guide.image ?? ""}
          onChange={(image) => onChange({ guide: { ...guide, image } } as Partial<StepSpec>)}
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

type Point = CanvasPoint;

/** SVG surface that maps pointer input into the learner's 800x600 canvas space. */
function useCanvasPoint(ref: React.RefObject<SVGSVGElement | null>) {
  return (event: React.PointerEvent): Point => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) / rect.width) * CANVAS_W),
      y: Math.round(((event.clientY - rect.top) / rect.height) * CANVAS_H),
    };
  };
}

function CaptureSurface({
  children,
  overlayGuide,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  children: React.ReactNode;
  overlayGuide?: OverlayGuide;
  onPointerDown: (point: Point, event: React.PointerEvent) => void;
  onPointerMove?: (point: Point, event: React.PointerEvent) => void;
  onPointerUp?: () => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const toPoint = useCanvasPoint(ref);
  const overlay = getOverlayDisplay(overlayGuide);
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="aspect-[4/3] w-full touch-none rounded-xl border border-brand-navy/15 bg-white"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPointerDown(toPoint(event), event);
      }}
      onPointerMove={(event) => onPointerMove?.(toPoint(event), event)}
      onPointerUp={() => onPointerUp?.()}
      onPointerCancel={() => onPointerUp?.()}
    >
      {overlay.src && overlay.visible ? (
        <image
          href={overlay.src}
          x={0}
          y={0}
          width={CANVAS_W}
          height={CANVAS_H}
          opacity={overlay.opacity}
          preserveAspectRatio={overlayPreserveAspectRatio(overlay.fit)}
        />
      ) : null}
      {/* faint dot grid for orientation */}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * 100} y1={0} x2={(i + 1) * 100} y2={CANVAS_H} stroke="#94a3b8" strokeOpacity={0.15} strokeDasharray="2 6" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={(i + 1) * 100} x2={CANVAS_W} y2={(i + 1) * 100} stroke="#94a3b8" strokeOpacity={0.15} strokeDasharray="2 6" />
      ))}
      {children}
    </svg>
  );
}

function CaptureActions({
  onUndo,
  onClear,
  count,
  noun,
}: {
  onUndo?: () => void;
  onClear: () => void;
  count: number;
  noun: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-navy/60 hover:text-brand-navy"
        >
          <Undo2 className="h-3.5 w-3.5" /> Remove last
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-xs font-bold text-brand-coral"
      >
        <Eraser className="h-3.5 w-3.5" /> Clear
      </button>
      <span className="ml-auto text-[11px] font-semibold text-brand-navy/45">
        {count} {noun}
      </span>
    </div>
  );
}

const OVERLAY_FIT_LABEL: Record<OverlayFit, string> = {
  contain: "Fit inside canvas",
  cover: "Fill canvas (crop)",
  fill: "Stretch to canvas",
};

function OverlayFields({
  guide,
  onPatch,
}: {
  guide: OverlayGuide;
  onPatch: (patch: Partial<OverlayGuide>) => void;
}) {
  const display = getOverlayDisplay(guide);

  return (
    <div className="space-y-3">
      <Field label="Overlay image (optional)">
        <MediaPicker value={guide.overlay ?? ""} onChange={(overlay) => onPatch({ overlay })} />
      </Field>

      {display.src ? (
        <div className="space-y-3 rounded-card border border-brand-navy/10 bg-brand-navy/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-brand-navy/60">Overlay display</p>
            <button
              type="button"
              onClick={() => onPatch({ overlayVisible: !display.visible })}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-navy/60 hover:bg-white"
              aria-pressed={display.visible}
            >
              {display.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {display.visible ? "Visible" : "Hidden"}
            </button>
          </div>

          <label className="block text-xs font-semibold text-brand-navy/60">
            <span className="flex items-center justify-between">
              Opacity
              <span className="text-brand-navy/45">{Math.round(display.opacity * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={display.opacity}
              onChange={(event) => onPatch({ overlayOpacity: Number(event.target.value) })}
              className="mt-1 w-full accent-brand-teal"
            />
          </label>

          <label className="block text-xs font-semibold text-brand-navy/60">
            Image fit
            <select
              value={display.fit}
              onChange={(event) => onPatch({ overlayFit: event.target.value as OverlayFit })}
              className="mt-1 w-full rounded-xl border border-brand-navy/15 bg-white px-2 py-2 text-sm font-normal text-brand-navy"
            >
              {OVERLAY_FITS.map((fit) => (
                <option key={fit} value={fit}>
                  {OVERLAY_FIT_LABEL[fit]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => onPatch({ overlay: "" })}
            className="text-xs font-bold text-brand-coral"
          >
            Remove overlay
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StrokePathInspector({
  step,
  onChange,
}: InspectorProps<Extract<StepSpec, { type: "stroke-path" }>>) {
  const guide = step.guide;
  const [draft, setDraft] = useState<Point[] | null>(null);
  const drawing = useRef(false);
  const path = draft ?? stripLegacyOriginSentinels(guide.path);
  const points = path.map((p) => `${p.x},${p.y}`).join(" ");

  const setPath = (next: Point[]) =>
    onChange({ guide: { ...guide, path: next } } as Partial<StepSpec>);

  return (
    <div className="space-y-3">
      <Field label="Guide path — draw it below">
        <CaptureSurface
          overlayGuide={guide}
          onPointerDown={(point) => {
            drawing.current = true;
            setDraft([point]);
          }}
          onPointerMove={(point) => {
            if (!drawing.current) return;
            setDraft((prev) => {
              if (!prev) return prev;
              const last = prev[prev.length - 1];
              const dist = Math.hypot(point.x - last.x, point.y - last.y);
              return dist >= 8 ? [...prev, point] : prev;
            });
          }}
          onPointerUp={() => {
            drawing.current = false;
            if (draft && draft.length >= 2) setPath(draft);
            setDraft(null);
          }}
        >
          <polyline
            points={points}
            fill="none"
            stroke="#2A9D8F"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
          />
          {path.length > 0 ? (
            <circle cx={path[0].x} cy={path[0].y} r={10} fill="#2A9D8F" fillOpacity={0.9} />
          ) : null}
        </CaptureSurface>
      </Field>
      <CaptureActions
        onClear={() => setPath([])}
        count={path.length}
        noun="points — draw a new stroke to replace"
      />
      <OverlayFields
        guide={guide}
        onPatch={(patch) => onChange({ guide: { ...guide, ...patch } } as Partial<StepSpec>)}
      />
      <Field label="Tip shown to the learner">
        <TextInput
          value={guide.tip ?? ""}
          onChange={(tip) => onChange({ guide: { ...guide, tip } } as Partial<StepSpec>)}
          placeholder="Follow the line slowly."
        />
      </Field>
    </div>
  );
}

function DotToDotInspector({
  step,
  onChange,
}: InspectorProps<Extract<StepSpec, { type: "dot-to-dot" }>>) {
  const guide = step.guide;
  const targets = stripLegacyOriginSentinels(guide.targets);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const polyline = targets.map((p) => `${p.x},${p.y}`).join(" ");

  const setTargets = (next: Point[]) =>
    onChange({ guide: { ...guide, targets: next } } as Partial<StepSpec>);

  const moveTarget = (index: number, point: Point) =>
    setTargets(targets.map((target, targetIndex) => (targetIndex === index ? point : target)));

  return (
    <div className="space-y-3">
      <Field label="Dots — tap empty canvas to place them; drag a dot to move it">
        <CaptureSurface
          overlayGuide={guide}
          onPointerDown={(point) => setTargets([...targets, clampDotPoint(point)])}
          onPointerMove={(point) => {
            if (dragIndex !== null) moveTarget(dragIndex, clampDotPoint(point));
          }}
          onPointerUp={() => setDragIndex(null)}
        >
          <polyline points={polyline} fill="none" stroke="#94a3b8" strokeWidth={3} strokeDasharray="6 6" />
          {targets.map((p, index) => (
            <g
              key={index}
              style={{ cursor: dragIndex === index ? "grabbing" : "grab" }}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragIndex(index);
              }}
            >
              <circle cx={p.x} cy={p.y} r={28} fill="transparent" pointerEvents="all" />
              <circle cx={p.x} cy={p.y} r={18} fill="#E76F51" fillOpacity={0.9} />
              <text
                x={p.x}
                y={p.y + 7}
                textAnchor="middle"
                fontSize={20}
                fontWeight="bold"
                fill="#fff"
                pointerEvents="none"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </CaptureSurface>
      </Field>
      <CaptureActions
        onUndo={() => setTargets(targets.slice(0, -1))}
        onClear={() => setTargets([])}
        count={targets.length}
        noun="dots — at least 2 needed; learners connect them in order"
      />
      <OverlayFields
        guide={guide}
        onPatch={(patch) => onChange({ guide: { ...guide, ...patch } } as Partial<StepSpec>)}
      />
      <Field label="Dot labels (optional, one per line — blank uses 1, 2, 3…)">
        <TextArea
          value={(guide.labels ?? []).join("\n")}
          onChange={(value) =>
            onChange({
              guide: { ...guide, labels: value.split("\n").map((line) => line.trim()).filter(Boolean) },
            } as Partial<StepSpec>)
          }
          rows={3}
        />
      </Field>
    </div>
  );
}

function AreaFillInspector({
  step,
  onChange,
}: InspectorProps<Extract<StepSpec, { type: "area-fill" }>>) {
  const guide = step.guide;
  return (
    <div className="space-y-3">
      <Field label="Target color — the color learners should fill with">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(guide.targetColor) ? guide.targetColor : "#D9A441"}
            onChange={(targetColor) => onChange({ guide: { ...guide, targetColor } } as Partial<StepSpec>)}
            className="h-9 w-14 cursor-pointer rounded-lg border border-brand-navy/15"
          />
          <TextInput
            value={guide.targetColor}
            onChange={(targetColor) => onChange({ guide: { ...guide, targetColor } } as Partial<StepSpec>)}
            placeholder="#D9A441"
          />
        </div>
      </Field>
      <Field label="Fill mask image — defines the colorable region">
        <MediaPicker
          value={guide.mask ?? ""}
          onChange={(mask) => onChange({ guide: { ...guide, mask } } as Partial<StepSpec>)}
        />
      </Field>
      <Field label="Coloring template id (optional — links to /admin/templates)">
        <TextInput
          value={guide.templateId ?? ""}
          onChange={(templateId) =>
            onChange({ guide: { ...guide, templateId: templateId || undefined } } as Partial<StepSpec>)
          }
          placeholder="e.g. the template's id"
        />
      </Field>
    </div>
  );
}

function LayerOrderInspector({
  step,
  onChange,
}: InspectorProps<Extract<StepSpec, { type: "layer-order" }>>) {
  const guide = step.guide;
  return (
    <div className="space-y-3">
      <Field label="Correct layer order (one per line, bottom first)">
        <TextArea
          value={guide.targetOrder.join("\n")}
          onChange={(value) =>
            onChange({
              guide: {
                ...guide,
                targetOrder: value.split("\n").map((line) => line.trim()).filter(Boolean),
              },
            } as Partial<StepSpec>)
          }
          rows={5}
        />
      </Field>
      <Field label="Draggable items (optional — defaults to the order list, one per line)">
        <TextArea
          value={(guide.items ?? []).join("\n")}
          onChange={(value) =>
            onChange({
              guide: {
                ...guide,
                items: value.split("\n").map((line) => line.trim()).filter(Boolean),
              },
            } as Partial<StepSpec>)
          }
          rows={4}
        />
      </Field>
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
    case "stroke-path":
      return <StrokePathInspector step={step} onChange={onChange} />;
    case "area-fill":
      return <AreaFillInspector step={step} onChange={onChange} />;
    case "dot-to-dot":
      return <DotToDotInspector step={step} onChange={onChange} />;
    case "layer-order":
      return <LayerOrderInspector step={step} onChange={onChange} />;
    default:
      return null;
  }
}
