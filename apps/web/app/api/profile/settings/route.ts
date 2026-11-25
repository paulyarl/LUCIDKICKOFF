import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/api/server";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await db
      .user({ userId: auth.userId, role: auth.role })
      .settings.get();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Settings lookup failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return NextResponse.json({ error: "invalid settings patch" }, { status: 400 });
  }

  try {
    const settings = await db
      .user({ userId: auth.userId, role: auth.role })
      .settings.update(patch as Record<string, unknown>);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Settings update failed" },
      { status: 500 },
    );
  }
}
