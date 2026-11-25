import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/server";
import { verifyImpersonation, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const cookieStore = await cookies();
  const payload = verifyImpersonation(cookieStore.get(IMPERSONATION_COOKIE)?.value);
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
}
