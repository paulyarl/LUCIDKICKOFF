"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LessonRunner, type LessonStep } from "./LessonRunner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { loadTutorialProgress, saveTutorialProgress } from "@/lib/learn/persistence"
import { trackLessonStarted, trackStepAttempted, trackLessonCompleted } from "@/lib/analytics/learningEvents"
import { useI18n } from "@/lib/i18n/provider"

export type TutorialSummary = {
  totalStars: number
  passedCount: number
  totalSteps: number
}

export type TutorialRunnerProps = {
  steps: LessonStep[]
  onFinished?: (summary: TutorialSummary) => void
  tutorialId?: string
  userId?: string
}

export function TutorialRunner({ steps, onFinished, tutorialId, userId }: TutorialRunnerProps) {
  const { t } = useI18n()
  const [idx, setIdx] = useState(0)
  const [totalStars, setTotalStars] = useState(0)
  const [passedCount, setPassedCount] = useState(0)
  const [totalDurationMs, setTotalDurationMs] = useState(0)
  const [sumScore, setSumScore] = useState(0)
  const stepStartRef = useRef<number | null>(null)

  const step = steps[idx]
  const progress = useMemo(() => ((idx) / steps.length) * 100, [idx, steps.length])

  // Load saved progress
  useEffect(() => {
    if (!tutorialId) return
    const saved = loadTutorialProgress(userId, tutorialId)
    if (saved) {
      setIdx(Math.min(saved.stepIndex ?? 0, steps.length - 1))
      setTotalStars(saved.stars ?? 0)
      setPassedCount(saved.passedSteps ?? 0)
    }
  }, [tutorialId, userId, steps.length])

  // Start timing for a step
  useEffect(() => {
    stepStartRef.current = performance.now()
  }, [idx])

  // Track lesson started once at beginning
  useEffect(() => {
    if (!tutorialId) return
    if (idx === 0 && steps.length > 0) {
      trackLessonStarted({
        lessonId: tutorialId,
        lessonTitle: steps[0]?.title ?? "Lesson",
        difficulty: "beginner",
      })
    }
  }, [idx, steps, tutorialId])

  const handleStepComplete = useCallback(
    (res: { passed: boolean; stars: number; distance: number }) => {
      if (res.passed) setPassedCount((c) => c + 1)
      setTotalStars((s) => s + (res.stars ?? 0))

      // Compute duration and score for analytics
      const end = performance.now()
      const duration = Math.max(0, Math.round((end - (stepStartRef.current ?? end))))
      setTotalDurationMs((t) => t + duration)
      const score = Math.max(0, Math.min(1, (res.stars ?? 0) / 3))
      setSumScore((v) => v + score)

      // Analytics: step attempted
      if (tutorialId) {
        trackStepAttempted({
          lessonId: tutorialId,
          stepId: step.id,
          stepIndex: idx,
          isCorrect: !!res.passed,
          score,
          stars: res.stars ?? 0,
          hintsUsed: 0,
          attemptDurationMs: duration,
        })
      }

      if (idx + 1 < steps.length) {
        const next = idx + 1
        setIdx(next)
        // Save progress
        if (tutorialId) {
          saveTutorialProgress(userId, {
            tutorialId,
            stepIndex: next,
            stars: (totalStars + (res.stars ?? 0)),
            passedSteps: (passedCount + (res.passed ? 1 : 0)),
            updatedAt: Date.now(),
          })
        }
      } else {
        const finalStars = totalStars + (res.stars ?? 0)
        const finalPassed = passedCount + (res.passed ? 1 : 0)
        const finalTotalDuration = totalDurationMs + 0 // already added above
        const avgScore = (sumScore + score) / Math.max(1, steps.length)
        onFinished?.({ totalStars: finalStars, passedCount: finalPassed, totalSteps: steps.length })
        if (tutorialId) {
          // Track lesson completed
          trackLessonCompleted({
            lessonId: tutorialId,
            totalSteps: steps.length,
            completedSteps: finalPassed,
            totalDurationMs: finalTotalDuration,
            averageScore: avgScore,
            starsEarned: Math.round(finalStars / steps.length),
          })
        }
        // Save final state
        if (tutorialId) {
          saveTutorialProgress(userId, {
            tutorialId,
            stepIndex: idx,
            stars: (totalStars + (res.stars ?? 0)),
            passedSteps: (passedCount + (res.passed ? 1 : 0)),
            updatedAt: Date.now(),
          })
        }
      }
    },
    [idx, steps.length, onFinished, totalStars, passedCount, tutorialId, userId, totalDurationMs, sumScore, step?.id]
  )

  if (!step) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{t('runner.stepCounter', { current: String(idx + 1), total: String(steps.length) })}</div>
        <div className="text-sm text-gray-600">{t('stats.starsLabel')}: {totalStars}</div>
      </div>
      <Progress value={progress} />

      <LessonRunner step={step} onComplete={handleStepComplete} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" disabled>
          {t('btn.skip')}
        </Button>
      </div>
    </div>
  )
}
