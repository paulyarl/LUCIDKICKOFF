"use client"
import React, { useCallback, useMemo, useState } from "react"
import { DrawingCanvas } from "../DrawingCanvas"
import type { Point } from "../../features/learn/engine/resample"
import type { StrokePathRubric } from "../../features/learn/engine/evaluators/strokePath"
import { evaluateStrokePath } from "../../features/learn/engine/evaluators/strokePath"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/provider"

export type LessonStep = {
  id: string
  type: "stroke-path"
  title: string
  guide: Point[]
  rubric?: StrokePathRubric
}

export type LessonRunnerProps = {
  step: LessonStep
  onComplete?: (result: {
    passed: boolean
    stars: number
    distance: number
  }) => void
}

export function LessonRunner({ step, onComplete }: LessonRunnerProps) {
  const { t } = useI18n()
  const [lastResult, setLastResult] = useState<{
    passed: boolean
    stars: number
    distance: number
  } | null>(null)

  const rubric: StrokePathRubric = useMemo(
    () => step.rubric ?? { maxFrechetPass: 18, starThresholds: [8, 14, 18], resamplePoints: 128 },
    [step.rubric]
  )

  const handleEvaluated = useCallback(
    (r: ReturnType<typeof evaluateStrokePath>) => {
      const res = { passed: r.passed, stars: r.stars, distance: r.distance }
      setLastResult(res)
    },
    []
  )

  const handleContinue = useCallback(() => {
    if (lastResult) onComplete?.(lastResult)
  }, [lastResult, onComplete])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DrawingCanvas guide={step.guide} rubric={rubric} onEvaluated={handleEvaluated} />
          <div className="flex items-center gap-2">
            <Button onClick={handleContinue} disabled={!lastResult || !lastResult.passed}>
              {t('btn.continue')}
            </Button>
            {lastResult && (
              <div className="text-sm text-gray-600">
                {t('status.lastResult')}: {lastResult.passed ? t('status.pass') : t('status.fail')} · {t('status.stars', { count: String(lastResult.stars) })} · {t('status.distanceShort')} {lastResult.distance.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
