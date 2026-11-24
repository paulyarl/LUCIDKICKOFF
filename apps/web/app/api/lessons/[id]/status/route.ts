import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "submit") {
    const auth = await requireApiUser(["parent", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { data, error } = await auth.supabase
      .from("lessons")
      .update({ status: "pending_review", review_note: null } as any)
      .eq("id", params.id)
      .eq("owner_id", auth.userId)
      .in("status", ["draft", "rejected"])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ lesson: data });
  }

  const auth = await requireApiUser(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const note = typeof body?.note === "string" ? body.note : null;
  const patch =
    action === "publish"
      ? { status: "published", review_note: note }
      : action === "promote"
        ? { status: "published", visibility: "catalog", review_note: note }
        : action === "reject"
          ? { status: "rejected", review_note: note }
          : null;

  if (!patch) {
    return NextResponse.json(
      { error: "action must be submit | publish | promote | reject" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("lessons")
    .update(patch as any)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ lesson: data });
}
