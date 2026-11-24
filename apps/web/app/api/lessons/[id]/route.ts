import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { parseStep, stepRegistry, type StepType } from "@/features/learn/steps/registry";



export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const key of ["title", "skill_tag", "est_minutes", "coloring_template_id", "locale"]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (patch.title !== undefined && (typeof patch.title !== "string" || !patch.title.trim())) {
    return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await auth.supabase
      .from("lessons")
      .update(patch)
      .eq("id", params.id)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let validatedSteps: ReturnType<typeof parseStep>[] | null = null;
  if (Array.isArray(body.steps)) {
    try {
      const parsed = body.steps.map((step: unknown, index: number) => {
        try {
          return parseStep(step);
        } catch (error) {
          throw new Error(
            `Step ${index + 1}: ${error instanceof Error ? error.message : "invalid step"}`,
          );
        }
      });
      validatedSteps = parsed;
      if (parsed.length > 0 && (parsed[0] as { type: string }).type !== "slide") {
        return NextResponse.json(
          { error: "the first step must be a slide" },
          { status: 400 },
        );
      }
      const seen = new Set<string>();
      for (const step of parsed) {
        const type = (step as { type: StepType }).type;
        if (stepRegistry[type]?.repeatable) continue;
        if (seen.has(type)) {
          return NextResponse.json(
            { error: `step type ${type} may only appear once per lesson` },
            { status: 400 },
          );
        }
        seen.add(type);
      }

    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "invalid step" },
        { status: 400 },
      );
    }

    const { error: delError } = await auth.supabase
      .from("lesson_steps")
      .delete()
      .eq("lesson_id", params.id);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });

    if (validatedSteps && validatedSteps.length > 0) {
      const rows = validatedSteps.map((step, index: number) => ({
        id: step.id ?? `${params.id}_s${index + 1}`,
        lesson_id: params.id,
        order_index: index,
        type: step.type,
        title: step.title ?? null,
        guide: step.guide ?? null,
        rubric: (step as any).rubric ?? null,
        hints: step.hints ?? null,
      }));
      const { error: insError } = await auth.supabase.from("lesson_steps").insert(rows);
      if (insError) return NextResponse.json({ error: insError.message }, { status: 400 });
    }
  }

  const { data: lesson, error } = await auth.supabase
    .from("lessons")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: steps } = await auth.supabase
    .from("lesson_steps")
    .select("*")
    .eq("lesson_id", params.id)
    .order("order_index");

  return NextResponse.json({ lesson, steps: steps ?? [] });
}
