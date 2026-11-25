"use client";

import { useMemo, useRef, useState } from "react";
import { repo } from "@/lib/api/repository";

type Pt = { x: number; y: number };
type Guide = { targets?: Pt[]; path?: Pt[] };
type Mode = "none" | "dot-to-dot" | "stroke-path";

/**
 * Authoring tool for lesson-type guide overlays on coloring templates.
 * Coordinates are stored normalized (0..1) so they scale to any canvas size —
 * same data shapes as the lesson step specs (dot-to-dot guide.targets,
 * stroke-path guide.path).
 */
export function TemplateGuideEditor({
  templateId,
  imageUrl,
  initialGuide,
}: {
  templateId: string;
  imageUrl: string;
  initialGuide: Guide | null;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(
    initialGuide?.targets ? "dot-to-dot" : initialGuide?.path ? "stroke-path" : "none",
  );
  const [targets, setTargets] = useState<Pt[]>(initialGuide?.targets ?? []);
  const [path, setPath] = useState<Pt[]>(initialGuide?.path ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const points = mode === "dot-to-dot" ? targets : path;
  const setPoints = mode === "dot-to-dot" ? setTargets : setPath;

  const addPoint = (e: React.MouseEvent) => {
    if (mode === "none" || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPoints((prev) => [...prev, { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }]);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const guide: Guide | null =
        mode === "none"
          ? null
          : mode === "dot-to-dot"
            ? targets.length >= 2 ? { targets } : null
            : path.length >= 2 ? { path } : null;
      await repo.catalog.updateTemplate(templateId, { guide });
      setMessage(guide ? "Guide saved — it now appears on the canvas for this template." : "Guide cleared.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-card border border-brand-navy/10 p-4">
      <div>
        <h2 className="font-heading text-lg font-bold">Activity guide</h2>
        <p className="text-sm text-brand-navy/60">
          Add a lesson-type activity overlay to this template. Dot-to-dot: click to place numbered
          dots in connection order. Trace path: click to build the guide polyline kids follow.
        </p>
      </div>

      <div className="flex gap-2">
        {(["none", "dot-to-dot", "stroke-path"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === m ? "bg-brand-teal text-white" : "border border-brand-navy/15 text-brand-navy/60"
            }`}
          >
            {m === "none" ? "No guide" : m === "dot-to-dot" ? "Dot-to-dot" : "Trace path"}
          </button>
        ))}
      </div>

      {mode !== "none" && (
        <>
          <div
            ref={boxRef}
            onClick={addPoint}
            className="relative w-full max-w-md cursor-crosshair select-none overflow-hidden rounded-lg border bg-white"
            style={{ aspectRatio: "1 / 1" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="template" className="absolute inset-0 h-full w-full object-fill" crossOrigin="anonymous" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {mode === "stroke-path" && path.length > 1 && (
                <polyline
                  points={path.map((pt) => `${pt.x * 100},${pt.y * 100}`).join(" ")}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.2"
                  strokeDasharray="2.5 2"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x * 100}
                    cy={pt.y * 100}
                    r={mode === "dot-to-dot" ? 2.6 : 1.6}
                    fill={mode === "dot-to-dot" ? "#ffffff" : "#6366f1"}
                    stroke={mode === "dot-to-dot" ? "#f4603e" : "#6366f1"}
                    strokeWidth="0.5"
                  />
                  {mode === "dot-to-dot" && (
                    <text
                      x={pt.x * 100}
                      y={pt.y * 100 + 1.3}
                      textAnchor="middle"
                      fontSize="2.8"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      {i + 1}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPoints((prev) => prev.slice(0, -1))}
              disabled={points.length === 0}
              className="rounded-lg border border-brand-navy/15 px-3 py-1.5 text-xs font-semibold text-brand-navy/60 disabled:opacity-40"
            >
              Undo point
            </button>
            <button
              type="button"
              onClick={() => setPoints([])}
              disabled={points.length === 0}
              className="rounded-lg border border-brand-navy/15 px-3 py-1.5 text-xs font-semibold text-brand-navy/60 disabled:opacity-40"
            >
              Clear all
            </button>
            <span className="text-xs text-brand-navy/50">
              {points.length} point{points.length === 1 ? "" : "s"}
              {points.length < 2 ? " — need at least 2" : ""}
            </span>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save guide"}
        </button>
        {message && <p className="text-xs font-semibold text-brand-navy/60">{message}</p>}
      </div>
    </div>
  );
}
