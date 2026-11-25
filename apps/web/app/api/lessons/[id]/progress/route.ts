import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { readLessonProgress, resolveEffectiveChild } from "@/lib/learn/learner";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const child = await resolveEffectiveChild(auth.supabase, auth.userId);
  const row = await readLessonProgress(auth.supabase, {
    lessonId: params.id,
    childProfileId: child.childProfileId,
    userId: auth.userId,
  });

  return NextResponse.json({
    progress: row
      ? { stepIndex: row.stepIndex, stars: row.stars, passedSteps: row.passedSteps }
      : null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.stepIndex !== "number" ||
    typeof body.stars !== "number" ||
    typeof body.passedSteps !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const child = await resolveEffectiveChild(auth.supabase, auth.userId);
  const existing = await readLessonProgress(auth.supabase, {
    lessonId: params.id,
    childProfileId: child.childProfileId,
    userId: auth.userId,
  });

  const fields = {
    step_index: body.stepIndex,
    stars: body.stars,
    passed_steps: body.passedSteps,
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await auth.supabase
        .from("user_lesson_progress")
        .update(fields)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await auth.supabase
        .from("user_lesson_progress")
        .insert({
          user_id: auth.userId,
          child_profile_id: child.childProfileId,
          lesson_id: params.id,
          ...fields,
        })
        .select("id")
        .single();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
