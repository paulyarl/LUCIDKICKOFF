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
  const action = body?.action;
  const visibility = body?.visibility === "catalog" ? "catalog" : "private";
  if (!["publish", "draft"].includes(action)) {
    return NextResponse.json({ error: "action must be publish | draft" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  if (action === "draft") {
    const { data, error } = await supabase
      .from("packs")
      .update({
        status: "draft",
        visibility: "private",
        reviewed_by: null,
        reviewed_at: null,
        published_at: null,
        updated_at: now,
      } as any)
      .eq("id", params.id)
      .select("id, status, visibility")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ pack: data });
  }

  const { data: items, error: itemsError } = await supabase
    .from("pack_items")
    .select("ref_id")
    .eq("pack_id", params.id)
    .eq("kind", "lesson");
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  const lessonIds = (items ?? []).map((item) => item.ref_id as string);
  if (lessonIds.length === 0) {
    return NextResponse.json({ error: "Add at least one lesson before publishing this pack" }, { status: 409 });
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, status, visibility")
    .in("id", lessonIds);
  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 400 });

  const rows = (lessons ?? []) as { id: string; status: string; visibility: string }[];
  const missing = lessonIds.filter((id) => !rows.some((lesson) => lesson.id === id));
  if (missing.length > 0) {
    return NextResponse.json({ error: "This pack contains lessons that are no longer available" }, { status: 409 });
  }
  if (rows.some((lesson) => lesson.status !== "published")) {
    return NextResponse.json({ error: "All lessons in the pack must be published first" }, { status: 409 });
  }
  if (visibility === "catalog" && rows.some((lesson) => lesson.visibility !== "catalog")) {
    return NextResponse.json({ error: "Catalog packs can only contain catalog lessons" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("packs")
    .update({
      status: "published",
      visibility,
      reviewed_by: auth.userId,
      reviewed_at: now,
      published_at: now,
      updated_at: now,
    } as any)
    .eq("id", params.id)
    .select("id, status, visibility")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pack: data });
}
