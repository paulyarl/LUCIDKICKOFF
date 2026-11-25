import type { SupabaseClient } from "@supabase/supabase-js";

// Sprint 2.10 — minimal derived badges (D11).
// Static catalog; awards are written by the progress route on each
// progress event. Artwork is B45 — UI uses icons until then.
export const BADGE_CATALOG = {
  "first-lesson": {
    title: "First Lesson!",
    blurb: "Finished your first lesson",
  },
  "pack-half": {
    title: "Halfway Explorer",
    blurb: "Finished half the lessons in a pack",
  },
  "pack-lessons-all": {
    title: "Lesson Legend",
    blurb: "Finished every lesson in a pack",
  },
  "pack-whole": {
    title: "Pack Champion",
    blurb: "Passed every step of every lesson in a pack",
  },
} as const;

export type BadgeId = keyof typeof BADGE_CATALOG;

type LearnerScope = { childProfileId: string | null; userId: string };

const learnerEq = (
  q: any,
  { childProfileId, userId }: LearnerScope,
) =>
  childProfileId
    ? q.eq("child_profile_id", childProfileId)
    : q.eq("user_id", userId).is("child_profile_id", null);

const award = async (
  supabase: SupabaseClient,
  learner: LearnerScope,
  awards: Array<{ badge_id: BadgeId; pack_id: string | null }>,
) => {
  if (awards.length === 0) return;
  await supabase.from("child_badges").insert(
    awards.map((a) => ({
      badge_id: a.badge_id,
      pack_id: a.pack_id,
      child_profile_id: learner.childProfileId,
      user_id: learner.userId,
    })),
  );
};

/**
 * Evaluate badge criteria after a progress write for `lessonId`.
 * Returns the badge ids awarded by this call (already-held badges skipped).
 * Non-fatal by contract — callers wrap in try/catch.
 */
export const evaluateBadges = async (
  supabase: SupabaseClient,
  learner: LearnerScope,
  lessonId: string,
): Promise<BadgeId[]> => {
  // Existing awards for this learner
  const { data: held } = await learnerEq(
    supabase.from("child_badges").select("badge_id, pack_id"),
    learner,
  );
  const heldKeys = new Set(
    (held ?? []).map((b: any) => `${b.badge_id}|${b.pack_id ?? ""}`),
  );

  // All progress rows + step counts for the lessons involved
  const { data: progress } = await learnerEq(
    supabase
      .from("user_lesson_progress")
      .select("lesson_id, step_index, passed_steps"),
    learner,
  );
  const progressRows = (progress ?? []) as {
    lesson_id: string;
    step_index: number;
    passed_steps: number;
  }[];
  const lessonIds = [
    ...new Set([lessonId, ...progressRows.map((r) => r.lesson_id)]),
  ];
  const { data: stepRows } = await supabase
    .from("lesson_steps")
    .select("lesson_id")
    .in("lesson_id", lessonIds);
  const stepCounts = new Map<string, number>();
  for (const row of stepRows ?? []) {
    stepCounts.set(
      row.lesson_id,
      (stepCounts.get(row.lesson_id) ?? 0) + 1,
    );
  }

  const completed = new Set(
    progressRows
      .filter((r) => (stepCounts.get(r.lesson_id) ?? Infinity) <= r.step_index)
      .map((r) => r.lesson_id),
  );
  const fullyPassed = new Set(
    progressRows
      .filter(
        (r) =>
          (stepCounts.get(r.lesson_id) ?? 0) > 0 &&
          r.passed_steps >= (stepCounts.get(r.lesson_id) ?? Infinity),
      )
      .map((r) => r.lesson_id),
  );

  const awards: Array<{ badge_id: BadgeId; pack_id: string | null }> = [];
  const queue = (badge_id: BadgeId, pack_id: string | null) => {
    if (!heldKeys.has(`${badge_id}|${pack_id ?? ""}`)) {
      awards.push({ badge_id, pack_id });
      heldKeys.add(`${badge_id}|${pack_id ?? ""}`);
    }
  };

  // first-lesson — any completed lesson
  if (completed.size > 0) queue("first-lesson", null);

  // Pack badges — evaluate every pack containing the just-updated lesson
  const { data: packItems } = await supabase
    .from("pack_items")
    .select("pack_id, ref_id")
    .eq("kind", "lesson");
  const packs = new Map<string, string[]>();
  for (const item of packItems ?? []) {
    const list = packs.get(item.pack_id) ?? [];
    list.push(item.ref_id);
    packs.set(item.pack_id, list);
  }
  for (const [packId, packLessonIds] of packs) {
    if (!packLessonIds.includes(lessonId)) continue;
    const done = packLessonIds.filter((id) => completed.has(id));
    const perfect = packLessonIds.filter((id) => fullyPassed.has(id));
    if (done.length * 2 >= packLessonIds.length) queue("pack-half", packId);
    if (done.length === packLessonIds.length) queue("pack-lessons-all", packId);
    if (perfect.length === packLessonIds.length) queue("pack-whole", packId);
  }

  await award(supabase, learner, awards);
  return awards.map((a) => a.badge_id);
};
