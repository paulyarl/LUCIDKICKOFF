"use client"
import React, { useCallback, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Circle } from "react-konva"
import type { KonvaEventObject } from "konva/lib/Node"
import { Button } from "@/components/ui/button"
import { evaluateStrokePath, type StrokePathRubric } from "../features/learn/engine/evaluators/strokePath"
import { resampleStroke, type Point } from "../features/learn/engine/resample"
import { useI18n } from "@/lib/i18n/provider"

export type Stroke = Point[]

type DrawingCanvasProps = {
  width?: number
  height?: number
  guide?: Point[]
  rubric?: StrokePathRubric
  onEvaluated?: (result: ReturnType<typeof evaluateStrokePath>) => void
}

export function DrawingCanvas({
  width = 600,
  height = 360,
  guide,
  rubric = { maxFrechetPass: 18, starThresholds: [8, 14, 18], resamplePoints: 128 },
  onEvaluated,
}: DrawingCanvasProps) {
  const { t } = useI18n()
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof evaluateStrokePath> | null>(null)
  const stageRef = useRef<any>(null)

  const currentStrokeRef = useRef<Stroke>([])

  const handlePointerDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    setIsDrawing(true)
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return
    currentStrokeRef.current = [{ x: pos.x, y: pos.y }]
  }, [])

  const handlePointerMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return
    currentStrokeRef.current.push({ x: pos.x, y: pos.y })
    // Trigger a re-render by updating a temp state via setStrokes clone
    setStrokes((prev) => {
      const clone = prev.slice()
      // show in-progress stroke separately by returning clone (render reads ref)
      return clone
    })
  }, [isDrawing])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentStrokeRef.current.length > 0) {
      setStrokes((prev) => [...prev, currentStrokeRef.current])
    }
    currentStrokeRef.current = []
  }, [isDrawing])

  const flattenedAttempt: Point[] = useMemo(() => {
    return strokes.flat()
  }, [strokes])

  const inProgressStroke = currentStrokeRef.current

  const doEvaluate = useCallback(() => {
    if (!guide || flattenedAttempt.length < 2) return
    const g = resampleStroke(guide, rubric.resamplePoints ?? 128)
    const a = resampleStroke(flattenedAttempt, rubric.resamplePoints ?? 128)
    const r = evaluateStrokePath(g, a, rubric)
    setResult(r)
    onEvaluated?.(r)
  }, [guide, flattenedAttempt, rubric, onEvaluated])

  const reset = useCallback(() => {
    setStrokes([])
    currentStrokeRef.current = []
    setResult(null)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button onClick={reset} variant="secondary">{t('btn.reset')}</Button>
        <Button onClick={doEvaluate} disabled={!guide || flattenedAttempt.length < 2}>{t('btn.evaluate')}</Button>
        {result && (
          <div className="ml-2 text-sm text-gray-700">
            <span className="font-medium">{t('label.result')}:</span> {result.passed ? t('status.pass') : t('status.tryAgain')} · {t('stats.starsLabel')} {result.stars} · {t('status.distanceShort')}{result.distance.toFixed(1)}
          </div>
        )}
      </div>

      <div className="border rounded-md overflow-hidden" role="region" aria-label={t('label.drawingCanvas')}>
        <Stage
          width={width}
          height={height}
          ref={stageRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={(e: any) => handlePointerDown(e)}
          onTouchMove={(e: any) => handlePointerMove(e)}
          onTouchEnd={() => handlePointerUp()}
        >
          <Layer>
            {/* Guide path */}
            {guide && guide.length > 1 && (
              <Line
                points={guide.flatMap((p) => [p.x, p.y])}
                stroke="#94a3b8"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                tension={0}
              />
            )}

            {/* Completed strokes */}
            {strokes.map((s, i) => (
              <Line
                key={i}
                points={s.flatMap((p) => [p.x, p.y])}
                stroke="#0ea5e9"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                tension={0}
              />
            ))}

            {/* In-progress stroke */}
            {inProgressStroke.length > 1 && (
              <Line
                points={inProgressStroke.flatMap((p) => [p.x, p.y])}
                stroke="#0284c7"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                dash={[8, 6]}
                tension={0}
              />
            )}

            {/* Start dot for guide */}
            {guide && guide[0] && (
              <Circle x={guide[0].x} y={guide[0].y} radius={4} fill="#475569" />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
