import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.supabase
    .from("lessons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  }

  const source = data as unknown as {
    title: string;
    skill_tag: string | null;
    est_minutes: number | null;
    locale: string;
    coloring_template_id: string | null;
  };

  const newId = `lesson_${crypto.randomUUID()}`;
  const { error: lessonError } = await auth.supabase.from("lessons").insert({
    id: newId,
    title: `${source.title} (copy)`,
    owner_id: auth.userId,
    status: "draft",
    visibility: "private",
    skill_tag: source.skill_tag,
    est_minutes: source.est_minutes,
    locale: source.locale,
    coloring_template_id: source.coloring_template_id,
  } as any);

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 400 });
  }

  const { data: steps, error: stepsError } = await auth.supabase
    .from("lesson_steps")
    .select("*")
    .eq("lesson_id", params.id)
    .order("order_index");

  if (stepsError) {
    await auth.supabase.from("lessons").delete().eq("id", newId);
    return NextResponse.json({ error: stepsError.message }, { status: 400 });
  }

  if (steps && steps.length > 0) {
    const rows = steps.map((step: any, index: number) => ({
      id: `${newId}_s${index + 1}`,
      lesson_id: newId,
      order_index: index,
      type: step.type,
      title: step.title,
      guide: step.guide,
      rubric: step.rubric,
      hints: step.hints,
    }));
    const { error: insertError } = await auth.supabase.from("lesson_steps").insert(rows);
    if (insertError) {
      await auth.supabase.from("lessons").delete().eq("id", newId);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }

  return NextResponse.json(
    { lesson: { id: newId, title: `${source.title} (copy)` } },
    { status: 201 },
  );
}
