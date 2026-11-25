import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/server";

const err = (e: unknown) =>
  e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Request failed";

export async function POST(req: Request) {
  const auth = await requireApiUser(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }

  try {
    await db.service().catalog.upsertCategory({
      id: typeof body.id === "string" ? body.id : undefined,
      slug,
      name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      image_path: body.image_path ?? null,
      kind: body.kind ?? "subject",
      parent_id: body.parent_id ?? null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      is_active: body.is_active ?? true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiUser(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await db.service().catalog.deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 400 });
  }
}
