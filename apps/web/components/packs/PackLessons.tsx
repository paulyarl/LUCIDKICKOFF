import Link from "next/link";
import { BookOpen, CheckCircle2, Lock, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveEffectiveChild } from "@/lib/learn/learner";

/**
 * Sprint 2.5 — pack → pack_items → lessons list. Each row links into the
 * player with est_minutes and per-lesson progress for the effective learner.
 * Lock state is entitlement-only (D8): free packs are always playable.
 */
export async function PackLessons({
  packId,
  isFree,
}: {
  packId: string;
  isFree: boolean;
}) {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("pack_items")
    .select("ref_id, position")
    .eq("pack_id", packId)
    .eq("kind", "lesson")
    .order("position");
  if (!items?.length) return null;

  const ids = items.map((i) => i.ref_id as string);
  const [{ data: lessonRows }, { data: { user } }, { data: firstTemplateItem }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, est_minutes, status, coloring_template_id")
      .in("id", ids),
    supabase.auth.getUser(),
    // S2.9 fallback: pack's first template when a lesson has no explicit one
    supabase
      .from("pack_items")
      .select("ref_id")
      .eq("pack_id", packId)
      .eq("kind", "template")
      .order("position")
      .limit(1)
      .maybeSingle(),
  ]);

  const ordered = ids
    .map((id) => (lessonRows ?? []).find((l: any) => l.id === id))
    .filter(
      (l): l is {
        id: string;
        title: string;
        est_minutes: number | null;
        status: string;
        coloring_template_id: string | null;
      } => Boolean(l)
    );
  if (ordered.length === 0) return null;

  const fallbackTemplateId = (firstTemplateItem?.ref_id as string | undefined) ?? null;

  const progress: Record<string, { stepIndex: number; passedSteps: number }> = {};
  if (user) {
    const child = await resolveEffectiveChild(supabase, user.id);
    let q = supabase
      .from("user_lesson_progress")
      .select("lesson_id, step_index, passed_steps")
      .in("lesson_id", ids);
    q = child.childProfileId
      ? q.eq("child_profile_id", child.childProfileId)
      : q.eq("user_id", user.id).is("child_profile_id", null);
    for (const row of (await q).data ?? []) {
      progress[row.lesson_id as string] = {
        stepIndex: row.step_index as number,
        passedSteps: row.passed_steps as number,
      };
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Lessons</h2>
      <ol className="space-y-2">
        {ordered.map((lesson, i) => {
          const p = progress[lesson.id];
          const playable = isFree && lesson.status === "published";
          return (
            <li key={lesson.id}>
              <Link
                href={playable ? `/learn/lesson/${lesson.id}` : "#"}
                aria-disabled={!playable}
                className={`flex items-center gap-3 rounded-card bg-white p-3 shadow-soft transition ${
                  playable ? "hover:shadow-md" : "pointer-events-none opacity-60"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal">
                  {i + 1}
                </span>
                <BookOpen className="h-4 w-4 shrink-0 text-brand-navy/40" />
                <span className="min-w-0 flex-1 truncate font-heading text-sm font-bold text-brand-navy">
                  {lesson.title}
                </span>
                {p && p.stepIndex > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-bold text-brand-teal">
                    <CheckCircle2 className="h-3 w-3" /> {p.passedSteps} passed
                  </span>
                ) : null}
                {lesson.est_minutes ? (
                  <span className="text-[11px] text-brand-navy/45">{lesson.est_minutes} min</span>
                ) : null}
                {!isFree ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/5 px-2 py-0.5 text-[10px] font-bold text-brand-navy/50">
                    <Lock className="h-3 w-3" /> Premium
                  </span>
                ) : null}
              </Link>
              {(() => {
                const colorTarget = lesson.coloring_template_id ?? fallbackTemplateId;
                return playable && colorTarget ? (
                  <Link
                    href={`/learn/lesson/${lesson.id}?then=color&fallback=${encodeURIComponent(colorTarget)}`}
                    className="mt-1 inline-flex items-center gap-1 pl-11 text-[11px] font-bold text-brand-teal hover:underline"
                  >
                    <Palette className="h-3 w-3" /> Study &amp; Color
                  </Link>
                ) : null;
              })()}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
