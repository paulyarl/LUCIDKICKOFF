import Link from "next/link";
import { BookOpen, CheckCircle2, Lock, Palette } from "lucide-react";
import { db } from "@/lib/api/server";
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
  const items = await db.catalog().packItems(packId, 'lesson');
  if (!items?.length) return null;

  const ids = items.map((i) => i.ref_id as string);
  const [lessonRows, user, templateItems] = await Promise.all([
    db.catalog().lessonsByIds(ids),
    db.auth().user(),
    // S2.9 fallback: pack's first template when a lesson has no explicit one
    db.catalog().packItems(packId, 'template'),
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

  const fallbackTemplateId = (templateItems?.[0]?.ref_id as string | undefined) ?? null;

  const progress: Record<string, { stepIndex: number; passedSteps: number }> = {};
  if (user) {
    const child = await resolveEffectiveChild(user.id);
    const role = (user.app_metadata as any)?.role;
    const scoped = await db.user({ userId: user.id, role }).learn.progressFor(ids, child.childProfileId);
    Object.assign(progress, scoped);
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
