import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const lessonId = typeof body?.lesson_id === "string" ? body.lesson_id : "";
  if (!lessonId) return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("pack_items")
    .select("id")
    .eq("pack_id", params.id)
    .eq("kind", "lesson")
    .eq("ref_id", lessonId)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true });

  const { count } = await supabase
    .from("pack_items")
    .select("*", { count: "exact", head: true })
    .eq("pack_id", params.id);

  const { error } = await supabase.from("pack_items").insert({
    pack_id: params.id,
    kind: "lesson",
    ref_id: lessonId,
    position: count ?? 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const ref = new URL(req.url).searchParams.get("ref_id");
  if (!ref) return NextResponse.json({ error: "ref_id is required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("pack_items")
    .delete()
    .eq("pack_id", params.id)
    .eq("kind", "lesson")
    .eq("ref_id", ref);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
