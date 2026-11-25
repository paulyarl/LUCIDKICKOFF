import Link from "next/link";
import { LessonPlayer } from '@/features/learn/components/LessonPlayer';
import { LessonBufferGate } from '@/features/learn/components/LessonBufferGate';
import { CategoryChipLinks } from "@/components/chrome/CategoryChipLinks";
import { db } from "@/lib/api/server";

import { readLessonProgress, resolveEffectiveChild } from "@/lib/learn/learner";
import { parseStep, type StepSpec } from "@/features/learn/steps/registry";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { lessonId: string };
  searchParams: { mode?: string; then?: string; fallback?: string };
}) {
  const [categories, lesson, stepsRows, user] = await Promise.all([
    db.catalog().categoriesFor("lesson", params.lessonId),
    db.catalog().lessonById(params.lessonId),
    db.catalog().lessonSteps(params.lessonId),
    db.auth().user(),
  ]);


  // Rows → StepSpec: the spec is split across columns; reassemble and validate.
  const steps: StepSpec[] = [];
  for (const row of stepsRows) {
    try {
      steps.push(
        parseStep({
          id: row.id,
          type: row.type,
          title: row.title ?? "Step",
          guide: row.guide ?? {},
          ...(row.rubric ? { rubric: row.rubric } : {}),
          ...(row.hints ? { hints: row.hints } : {}),
        }),
      );
    } catch {
      // invalid step content — skip rather than break the whole lesson
    }
  }

  // S2.11 (D15): an unauthenticated visitor is the device-local guest learner.
  // Progress persists under lc-progress:guest:* and survives sign-in for the
  // Sprint 3 migration; there is no guest "session" to clear — signing in
  // simply switches learnerKey to the profile/user scope.
  const child = user ? await resolveEffectiveChild(user.id) : { childProfileId: null };
  const learnerKey = child.childProfileId ?? user?.id ?? "guest";

  // S2.14 — the pack this lesson belongs to supplies the manifest for the
  // per-lesson buffer; a lesson outside any exported pack plays unbuffered.
  const packSlug = await db.catalog().packSlugForLesson(params.lessonId);
  const serverProgress = user
    ? await readLessonProgress({
        lessonId: params.lessonId,
        childProfileId: child.childProfileId,
        userId: user.id,
      })
    : null;

  // S2.9 — Study & Color chain: ?then=color routes completion into /canvas.
  const colorTarget =
    searchParams.then === "color"
      ? lesson?.coloring_template_id ?? searchParams.fallback ?? null
      : null;
  const thenColorHref = colorTarget
    ? `/canvas?templateId=${encodeURIComponent(colorTarget)}`
    : undefined;

  return (
    <div className="force-light min-h-screen bg-brand-cream">
      {categories.length > 0 && (
        <div className="border-b border-brand-navy/10 px-4 py-2">
          <div className="mx-auto max-w-4xl">
            <CategoryChipLinks categories={categories} />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {lesson ? (
          <LessonBufferGate
            lessonId={lesson.id}
            packSlug={packSlug}
            steps={stepsRows as Array<{ guide?: unknown; rubric?: unknown; hints?: unknown }>}
          >
            <LessonPlayer
              lessonId={lesson.id}
              title={lesson.title}
              steps={steps}
              learnerKey={learnerKey}
              serverProgress={serverProgress}
              backHref="/packs"
              thenColorHref={thenColorHref}
              syncEnabled={!!user}
            />
          </LessonBufferGate>
        ) : (
          <div className="rounded-panel bg-white p-8 text-center shadow-soft">
            <p className="font-heading text-lg font-bold text-brand-navy">Lesson not available</p>
            <p className="mt-1 text-sm text-brand-navy/60">
              It may not be published yet, or it isn't shared with you.
            </p>
            <Link
              href="/packs"
              className="mt-4 inline-block rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white"
            >
              Browse packs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
