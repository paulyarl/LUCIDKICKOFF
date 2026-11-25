import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db, type ContentType } from "@/lib/db/server";

const err = (e: unknown) =>
  e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Request failed";

const TYPES: ContentType[] = ["pack", "lesson", "template", "tutorial", "artwork"];

function parse(url: string, body?: any) {
  const q = new URL(url).searchParams;
  const contentType = (body?.contentType ?? q.get("contentType")) as ContentType;
  const contentId = (body?.contentId ?? q.get("contentId")) as string;
  const categoryId = (body?.categoryId ?? q.get("categoryId")) as string;
  const position = typeof body?.position === "number" ? body.position : 0;
  if (!TYPES.includes(contentType) || !contentId || !categoryId) return null;
  return { contentType, contentId, categoryId, position };
}

// No role gate here: the categorize_content RPC enforces permissions
// itself (admin for all types; lesson owners for their own lessons).
export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const p = parse(req.url, body);
  if (!p) return NextResponse.json({ error: "contentType, contentId, categoryId required" }, { status: 400 });

  try {
    // db.user().catalog goes through categorize_content RPC — the DB itself
    // enforces is_admin() or lesson-ownership under the caller's JWT.
    await db
      .user({ userId: auth.userId, role: auth.role })
      .catalog.categorize(p.contentType, p.contentId, p.categoryId, p.position);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const p = parse(req.url);
  if (!p) return NextResponse.json({ error: "contentType, contentId, categoryId required" }, { status: 400 });

  try {
    await db
      .user({ userId: auth.userId, role: auth.role })
      .catalog.uncategorize(p.contentType, p.contentId, p.categoryId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 400 });
  }
}
