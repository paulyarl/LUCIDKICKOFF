import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";

export async function POST(req: Request) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const id = `lesson_${crypto.randomUUID()}`;
  const { data, error } = await auth.supabase
    .from("lessons")
    .insert({
      id,
      title,
      owner_id: auth.userId,
      status: "draft",
      visibility: "private",
      est_minutes: Number.isFinite(body?.est_minutes) ? body.est_minutes : null,
      locale: body?.locale ?? "en",
      coloring_template_id: body?.coloring_template_id ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ lesson: data }, { status: 201 });
}
