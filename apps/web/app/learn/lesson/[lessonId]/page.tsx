import Link from "next/link";
import { LessonPlayer } from '@/features/learn/components/LessonPlayer';
import { CategoryChipLinks } from "@/components/chrome/CategoryChipLinks";
import { db } from "@/lib/db/server";
import { createClient } from "@/lib/supabase/server";
import { readLessonProgress, resolveEffectiveChild } from "@/lib/learn/learner";
import { parseStep, type StepSpec } from "@/features/learn/steps/registry";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { lessonId: string };
  searchParams: { mode?: string; then?: string; fallback?: string };
}) {
  const supabase = createClient();
  const [categories, lessonRes, stepsRes, sessionRes] = await Promise.all([
    db.catalog().categoriesFor("lesson", params.lessonId),
    supabase
      .from("lessons")
      .select("id, title, est_minutes, coloring_template_id")
      .eq("id", params.lessonId)
      .maybeSingle(),
    supabase
      .from("lesson_steps")
      .select("id, order_index, type, title, guide, rubric, hints")
      .eq("lesson_id", params.lessonId)
      .order("order_index"),
    supabase.auth.getUser(),
  ]);

  const lesson = lessonRes.data as {
    id: string;
    title: string;
    est_minutes: number | null;
    coloring_template_id: string | null;
  } | null;
  const user = sessionRes.data.user;

  // Rows → StepSpec: the spec is split across columns; reassemble and validate.
  const steps: StepSpec[] = [];
  for (const row of stepsRes.data ?? []) {
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

  const child = user ? await resolveEffectiveChild(supabase, user.id) : { childProfileId: null };
  const learnerKey = child.childProfileId ?? user?.id ?? "guest";
  const serverProgress = user
    ? await readLessonProgress(supabase, {
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
          <LessonPlayer
            lessonId={lesson.id}
            title={lesson.title}
            steps={steps}
            learnerKey={learnerKey}
            serverProgress={serverProgress}
            backHref="/packs"
            thenColorHref={thenColorHref}
          />
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
