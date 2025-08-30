"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonRunner, type LessonStep } from "@/components/learning/LessonRunner";
import { loadAuthorDraft, saveAuthorDraft } from "@/lib/learn/persistence";

type Rubric = {
  maxFrechetPass: number;
  starThresholds: [number, number, number];
  resamplePoints?: number;
};

type Hint = { tier: 1 | 2 | 3; text: string };

export default function AuthoringWizard() {
  const [title, setTitle] = useState("New Stroke Path Step");
  const [stepId, setStepId] = useState("custom-step-1");
  const [guide, setGuide] = useState<{ x: number; y: number }[]>([
    { x: 80, y: 180 },
    { x: 480, y: 140 },
  ]);
  const [rubric, setRubric] = useState<Rubric>({ maxFrechetPass: 18, starThresholds: [8, 14, 18], resamplePoints: 128 });
  const [hints, setHints] = useState<Hint[]>([]);
  const saveTimer = useRef<number | null>(null)

  // Load draft if it exists when stepId changes
  useEffect(() => {
    const d = loadAuthorDraft(stepId)
    if (d) {
      if (d.title) setTitle(d.title)
      if (d.guide) setGuide(d.guide)
      if (d.rubric && typeof d.rubric === 'object') setRubric(d.rubric as Rubric)
      if (d.hints) setHints(d.hints)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId])

  // Auto-save debounce
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveAuthorDraft({
        id: stepId,
        kind: 'stroke-path',
        title,
        guide,
        rubric,
        hints,
        updatedAt: Date.now(),
      })
    }, 500)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [stepId, title, JSON.stringify(guide), JSON.stringify(rubric), JSON.stringify(hints)])

  const addPointMouse = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setGuide((g) => [...g, { x: pos.x, y: pos.y }]);
  }, []);

  const addPointTouch = useCallback((e: KonvaEventObject<TouchEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setGuide((g) => [...g, { x: pos.x, y: pos.y }]);
  }, []);

  const resetGuide = useCallback(() => setGuide([]), []);

  const step: LessonStep = useMemo(
    () => ({ id: stepId, type: "stroke-path", title, guide, rubric }),
    [stepId, title, guide, rubric]
  );

  const addHint = () => setHints((hs) => [...hs, { tier: Math.min(3, (hs[hs.length - 1]?.tier ?? 0) + 1) as 1 | 2 | 3, text: "" }]);
  const updateHint = (i: number, text: string) => setHints((hs) => hs.map((h, idx) => (idx === i ? { ...h, text } : h)));
  const removeHint = (i: number) => setHints((hs) => hs.filter((_, idx) => idx !== i));

  const exportJson = () => {
    const payload = {
      id: stepId,
      type: "stroke-path" as const,
      title,
      guide,
      rubric,
      hints,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stepId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10" data-testid="author-wizard">
      <h1 className="text-3xl md:text-4xl font-heading tracking-tight text-text-primary">Authoring Wizard</h1>
      <p className="mt-2 text-text-secondary">Create stroke-path lesson steps, preview them, and export JSON.</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <Card>
          <CardHeader>
            <CardTitle>Step Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="step-id">Step ID</Label>
              <Input id="step-id" value={stepId} onChange={(e) => setStepId(e.target.value)} placeholder="unique-step-id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pass">Max Fréchet Pass</Label>
                <Input
                  id="pass"
                  type="number"
                  value={rubric.maxFrechetPass}
                  onChange={(e) => setRubric((r) => ({ ...r, maxFrechetPass: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Star Thresholds</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={rubric.starThresholds[0]}
                    onChange={(e) => setRubric((r) => ({ ...r, starThresholds: [Number(e.target.value), r.starThresholds[1], r.starThresholds[2]] as [number, number, number] }))}
                  />
                  <Input
                    type="number"
                    value={rubric.starThresholds[1]}
                    onChange={(e) => setRubric((r) => ({ ...r, starThresholds: [r.starThresholds[0], Number(e.target.value), r.starThresholds[2]] as [number, number, number] }))}
                  />
                  <Input
                    type="number"
                    value={rubric.starThresholds[2]}
                    onChange={(e) => setRubric((r) => ({ ...r, starThresholds: [r.starThresholds[0], r.starThresholds[1], Number(e.target.value)] as [number, number, number] }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resample">Resample Points</Label>
                <Input
                  id="resample"
                  type="number"
                  value={rubric.resamplePoints ?? 128}
                  onChange={(e) => setRubric((r) => ({ ...r, resamplePoints: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hints (tiers 1–3)</Label>
                <Button size="sm" onClick={addHint}>Add hint</Button>
              </div>
              <div className="space-y-3">
                {hints.map((h, i) => (
                  <div key={i} className="space-y-1">
                    <Label>Tier {h.tier}</Label>
                    <div className="flex gap-2">
                      <textarea
                        className="w-full min-h-[72px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                        value={h.text}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateHint(i, e.target.value)}
                        placeholder={`Hint for tier ${h.tier}`}
                      />
                      <Button variant="ghost" onClick={() => removeHint(i)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={exportJson}>Export JSON</Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Guide Editor + Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guide Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden" role="region" aria-label="Guide editor">
                <Stage width={600} height={360} onMouseDown={addPointMouse} onTouchStart={addPointTouch}>
                  <Layer>
                    {guide.length > 1 && (
                      <Line
                        points={guide.flatMap((p) => [p.x, p.y])}
                        stroke="#64748b"
                        strokeWidth={3}
                        lineCap="round"
                        lineJoin="round"
                      />
                    )}
                    {guide.map((p, i) => (
                      <Circle key={i} x={p.x} y={p.y} radius={4} fill={i === 0 ? "#0ea5e9" : "#1e293b"} />
                    ))}
                  </Layer>
                </Stage>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={resetGuide}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonRunner step={step} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
