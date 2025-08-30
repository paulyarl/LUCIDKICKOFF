"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { TutorialRunner } from "../../../../components/learning/TutorialRunner";
import type { LessonStep } from "@/components/learning/LessonRunner";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/provider";

export default function TutorialRunnerScaffold() {
  const params = useParams<{ tutorialId: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const [steps, setSteps] = useState<LessonStep[]>([]);

  useEffect(() => {
    const tutorialId = String(params?.tutorialId);
    let mounted = true;
    fetch(`/tutorials/${tutorialId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`404: ${tutorialId}`))))
      .then((data) => {
        if (!mounted) return;
        // Map checkpoints to simple stroke-path steps as placeholders for now
        const mapped: LessonStep[] = (data?.checkpoints ?? []).map((cp: any, i: number) => {
          // Create a simple guide varying by index to give different motions
          const guides: { x: number; y: number }[][] = [
            [ { x: 80, y: 200 }, { x: 520, y: 200 } ], // straight
            [ { x: 100, y: 260 }, { x: 500, y: 100 } ], // diagonal
            [ { x: 80, y: 260 }, { x: 220, y: 120 }, { x: 520, y: 240 } ], // curve (approximated by polyline)
            [ { x: 80, y: 180 }, { x: 220, y: 260 }, { x: 380, y: 100 }, { x: 520, y: 180 } ], // S-like polyline
            [ { x: 120, y: 220 }, { x: 480, y: 220 } ],
          ];
          const g = guides[i % guides.length];
          return {
            id: cp.id,
            type: "stroke-path",
            title: cp.title,
            guide: g,
          } satisfies LessonStep;
        });
        setSteps(mapped);
      })
      .catch(() => {
        // Fallback: two simple steps
        setSteps([
          { id: `fallback-1`, type: "stroke-path", title: "Straight", guide: [ { x: 60, y: 180 }, { x: 540, y: 180 } ] },
          { id: `fallback-2`, type: "stroke-path", title: "Diagonal", guide: [ { x: 80, y: 260 }, { x: 520, y: 100 } ] },
        ]);
      });
    return () => { mounted = false };
  }, [params?.tutorialId]);

  const title = useMemo(() => String(params?.tutorialId), [params?.tutorialId]);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" data-testid="tutorial-runner">
      <h1 className="text-2xl md:text-3xl font-heading text-text-primary">{t('page.tutorialRunner.title')}</h1>
      <p className="mt-2 text-text-secondary">{t('page.tutorialRunner.subtitle', { id: title })}</p>
      <div className="mt-6">
        <TutorialRunner
          steps={steps}
          tutorialId={title}
          userId={user?.id}
        />
      </div>
    </main>
  );
}
