import { createClient } from "@/lib/supabase/server";
import { getValidatedImpersonation } from "@/lib/auth/impersonation";

export type EffectiveChild = {
  childProfileId: string | null;
  /** Storage key scope for progress: child profile when known, else the auth user. */
  nickname: string | null;
};

/**
 * Resolves the effective learner for the current request:
 * - guardian/admin-selected child → signed impersonation cookie's profileId
 * - authenticated child → their child_profiles row (auth_user_id)
 * - guardian/teacher playing directly → no profile; progress keys to user_id
 */
export async function resolveEffectiveChild(userId: string): Promise<EffectiveChild> {
  const supabase = createClient();
  const payload = await getValidatedImpersonation();

  const profileId = payload?.profileId ?? null;
  const impersonatedUserId = payload?.userId ?? null;

  if (profileId) {
    const { data } = await supabase
      .from("child_profiles")
      .select("id, nickname")
      .eq("id", profileId)
      .maybeSingle();
    if (data) {
      return { childProfileId: data.id as string, nickname: (data as any).nickname ?? null };
    }
  }

  const authChildUserId = impersonatedUserId ?? userId;
  const { data } = await supabase
    .from("child_profiles")
    .select("id, nickname")
    .eq("auth_user_id", authChildUserId)
    .maybeSingle();

  return {
    childProfileId: (data?.id as string) ?? null,
    nickname: (data as any)?.nickname ?? null,
  };
}

export async function readLessonProgress(
  opts: { lessonId: string; childProfileId: string | null; userId: string },
): Promise<{ id: string; stepIndex: number; stars: number; passedSteps: number } | null> {
  const supabase = createClient();
  let query = supabase
    .from("user_lesson_progress")
    .select("id, step_index, stars, passed_steps")
    .eq("lesson_id", opts.lessonId);
  query = opts.childProfileId
    ? query.eq("child_profile_id", opts.childProfileId)
    : query.eq("user_id", opts.userId).is("child_profile_id", null);
  const { data } = await query.maybeSingle();
  return data
    ? {
        id: data.id as string,
        stepIndex: data.step_index as number,
        stars: data.stars as number,
        passedSteps: data.passed_steps as number,
      }
    : null;
}
