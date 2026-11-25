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

  const { data: lastItem } = await supabase
    .from("pack_items")
    .select("position")
    .eq("pack_id", params.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = typeof lastItem?.position === "number" ? lastItem.position + 1 : 0;
  const { error } = await supabase.from("pack_items").insert({
    pack_id: params.id,
    kind: "lesson",
    ref_id: lessonId,
    position: nextPosition,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const refIds: string[] | null = Array.isArray(body?.ref_ids) ? body.ref_ids : null;
  if (!refIds || refIds.some((ref) => typeof ref !== "string" || ref.length === 0)) {
    return NextResponse.json({ error: "ref_ids must be an array of lesson ids" }, { status: 400 });
  }

  const requested = new Set(refIds);
  if (requested.size !== refIds.length) {
    return NextResponse.json({ error: "ref_ids cannot contain duplicates" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existingRows, error: readError } = await supabase
    .from("pack_items")
    .select("id, ref_id, position")
    .eq("pack_id", params.id)
    .eq("kind", "lesson");

  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });

  const existing = (existingRows ?? []) as { id: string; ref_id: string; position: number }[];
  const existingIds = new Set(existing.map((row) => row.ref_id));
  if (
    existing.length !== refIds.length ||
    refIds.some((ref) => !existingIds.has(ref))
  ) {
    return NextResponse.json(
      { error: "ref_ids must match the lessons currently in this pack" },
      { status: 400 },
    );
  }

  const rowsByRef = new Map(existing.map((row) => [row.ref_id, row]));
  const updates = refIds.map((ref, index) => ({
    ...rowsByRef.get(ref)!,
    pack_id: params.id,
    kind: "lesson",
    position: index,
  }));

  if (updates.length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("pack_items").upsert(updates);
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
