import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/api/server";

export const runtime = "nodejs";

// GET /api/children/[id] — resolves a child profile by child_profiles.id or
// auth_user_id. Parents are limited to their own children by RLS; admins go
// through the service repository.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiUser(["parent", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const repo =
      auth.role === "admin"
        ? db.service()
        : db.user({ userId: auth.userId, role: auth.role });

    const profile = await repo.family.childContext({ anyId: params.id });
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    return NextResponse.json({
      child: {
        id: profile.auth_user_id ?? profile.id,
        childProfileId: profile.id,
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url ?? null,
        birthdate: profile.birthdate ?? null,
        active: profile.active ?? true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: ((error as { message?: string } | null)?.message) ?? "Child lookup failed" },
      { status: 500 },
    );
  }
}
