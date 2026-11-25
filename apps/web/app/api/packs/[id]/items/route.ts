import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

async function packAccessError(
  supabase: ReturnType<typeof createServiceClient>,
  packId: string,
  userId: string,
  role: string,
) {
  const { data, error } = await supabase
    .from("packs")
    .select("id, owner_id, status")
    .eq("id", packId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const pack = data as { owner_id?: string | null; status?: string } | null;
  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  if (role !== "admin") {
    if (pack.owner_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["draft", "pending_review", "rejected"].includes(pack.status ?? "draft")) {
      return NextResponse.json({ error: "Published packs cannot be edited" }, { status: 409 });
    }
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const lessonId = typeof body?.lesson_id === "string" ? body.lesson_id : "";
  if (!lessonId) return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });

  const supabase = createServiceClient();
  const accessError = await packAccessError(supabase, params.id, auth.userId, auth.role);
  if (accessError) return accessError;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, owner_id, status, visibility")
    .eq("id", lessonId)
    .maybeSingle();
  const lessonRow = lesson as { owner_id?: string | null; status?: string; visibility?: string } | null;
  const canUseLesson = Boolean(
    lessonRow &&
      (auth.role === "admin" ||
        lessonRow.owner_id === auth.userId ||
        (lessonRow.status === "published" && lessonRow.visibility === "catalog")),
  );
  if (!canUseLesson) {
    return NextResponse.json({ error: "Lesson is not available for this pack" }, { status: 403 });
  }

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
  const auth = await requireApiUser(["parent", "admin"]);
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
  const accessError = await packAccessError(supabase, params.id, auth.userId, auth.role);
  if (accessError) return accessError;

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
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const ref = new URL(req.url).searchParams.get("ref_id");
  if (!ref) return NextResponse.json({ error: "ref_id is required" }, { status: 400 });

  const supabase = createServiceClient();
  const accessError = await packAccessError(supabase, params.id, auth.userId, auth.role);
  if (accessError) return accessError;

  const { error } = await supabase
    .from("pack_items")
    .delete()
    .eq("pack_id", params.id)
    .eq("kind", "lesson")
    .eq("ref_id", ref);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
