"use client"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { TutorialRunner } from "../../../../../components/learning/TutorialRunner"
import type { TutorialSummary } from "../../../../../components/learning/TutorialRunner"
import type { LessonStep } from "@/components/learning/LessonRunner"
import { useAuth } from "@/lib/auth/use-auth"
import { useI18n } from "@/lib/i18n/provider"

export default function LessonRunnerPage() {
  const params = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const { t } = useI18n()
  const [steps, setSteps] = useState<LessonStep[]>([])

  // Parse very simple SVG path: "M x y L x y" -> two points scaled to canvas 600x360
  const parseSimpleMoveLine = useCallback((d: string): { x: number; y: number }[] | null => {
    // Match patterns like: M10 25 L190 25 or with commas
    const m = d.match(/M\s*([\d.]+)[,\s]+([\d.]+)\s+L\s*([\d.]+)[,\s]+([\d.]+)/i)
    if (!m) return null
    const x1 = parseFloat(m[1]); const y1 = parseFloat(m[2])
    const x2 = parseFloat(m[3]); const y2 = parseFloat(m[4])
    // Assume original viewBox height ~ 50-120 and width ~ 200-300 (from seed), scale roughly to our 600x360 canvas
    const scaleX = 600 / 300
    const scaleY = 360 / 120
    return [
      { x: x1 * scaleX, y: y1 * scaleY },
      { x: x2 * scaleX, y: y2 * scaleY },
    ]
  }, [])

  useEffect(() => {
    const lessonId = String(params?.lessonId)
    let mounted = true
    fetch(`/lessons/${lessonId}.json`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`404: ${lessonId}`)))
      .then((data) => {
        if (!mounted) return
        // Map only simple stroke-path steps with straight line paths (s-1, s-2 in seed)
        const mapped: LessonStep[] = (data?.steps ?? [])
          .filter((s: any) => s?.type === 'stroke-path' && typeof s?.guide?.path === 'string')
          .map((s: any) => {
            const pts = parseSimpleMoveLine(s.guide.path)
            if (!pts) return null
            const step: LessonStep = {
              id: s.id,
              type: 'stroke-path',
              title: s.title,
              guide: pts,
            }
            return step
          })
          .filter(Boolean)
        setSteps(mapped)
      })
      .catch(() => {
        // Fallback to two basic steps if fetch/parse fails
        setSteps([
          {
            id: `${lessonId}-s1`,
            type: 'stroke-path',
            title: 'Straight Line',
            guide: [ { x: 60, y: 180 }, { x: 540, y: 180 } ],
          },
          {
            id: `${lessonId}-s2`,
            type: 'stroke-path',
            title: 'Long Straight Line',
            guide: [ { x: 40, y: 240 }, { x: 560, y: 120 } ],
          },
        ])
      })
    return () => { mounted = false }
  }, [params?.lessonId, parseSimpleMoveLine])

  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState<{ totalStars: number; passedCount: number } | null>(null)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8" data-testid="lesson-runner">
      <h1 className="text-2xl md:text-3xl font-heading text-text-primary">{t('page.lessonRunner.title')}</h1>
      <p className="mt-2 text-text-secondary">{t('page.lessonRunner.subtitle', { id: String(params?.lessonId) })}</p>

      {!done ? (
        <div className="mt-6">
          <TutorialRunner
            steps={steps}
            onFinished={(s: TutorialSummary) => {
              setSummary(s)
              setDone(true)
            }}
            tutorialId={String(params?.lessonId)}
            userId={user?.id}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">{t('page.tutorial.complete')}</h2>
          {summary && (
            <p className="mt-2 text-sm text-gray-600">{t('page.tutorial.summary', { passed: String(summary.passedCount), stars: String(summary.totalStars) })}</p>
          )}
        </div>
      )}
    </main>
  )
}
