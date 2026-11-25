import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/server";
import { getValidatedImpersonation } from "@/lib/auth/impersonation";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const payload = await getValidatedImpersonation();
    const profile = payload?.profileId
      ? await (payload.admin
          ? db.service()
          : db.user({ userId: auth.userId, role: auth.role })
        ).family.childContext({ profileId: payload.profileId })
      : payload?.admin && payload.userId
        ? await db.service().family.childContext({ userId: payload.userId })
        : await db
            .user({ userId: auth.userId, role: auth.role })
            .family.childContext({ userId: auth.userId });

    if (!profile) return NextResponse.json({ child: null });
    return NextResponse.json({
      child: {
        id: profile.id,
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url ?? null,
        birthdate: profile.birthdate ?? null,
        active: profile.active,
      },
    });
  } catch (error) {
    const message =
      (error as { message?: string } | null)?.message ?? "Child context failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
