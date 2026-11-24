import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyImpersonation, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const cookieStore = await cookies();
  const payload = verifyImpersonation(cookieStore.get(IMPERSONATION_COOKIE)?.value);
  const supabase = payload?.admin ? createServiceClient() : auth.supabase;

  let profile: any = null;

  if (payload?.profileId) {
    const { data } = await supabase
      .from("child_profiles")
      .select("id, nickname, avatar_url, birthdate, active")
      .eq("id", payload.profileId)
      .maybeSingle();
    profile = data;
  } else if (payload?.admin && payload.userId) {
    const { data } = await supabase
      .from("child_profiles")
      .select("id, nickname, avatar_url, birthdate, active")
      .or(`id.eq.${payload.userId},auth_user_id.eq.${payload.userId}`)
      .maybeSingle();
    profile = data;
  } else {
    const { data } = await supabase
      .from("child_profiles")
      .select("id, nickname, avatar_url, birthdate, active")
      .eq("auth_user_id", auth.userId)
      .maybeSingle();
    profile = data;
  }

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
