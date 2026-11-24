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
  const guardianId =
    payload?.admin && payload.userId ? payload.userId : auth.userId;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("child_guardians")
    .select("child_profile_id, child_profiles!inner(id, nickname, avatar_url, auth_user_id, birthdate)")
    .eq("guardian_id", guardianId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const children = (data ?? [])
    .map((row: any) => {
      const profile = Array.isArray(row.child_profiles) ? row.child_profiles[0] : row.child_profiles;
      if (!profile) return null;
      return {
        id: profile.auth_user_id ?? profile.id,
        childProfileId: profile.id,
        email: profile.nickname ?? "Learner",
        avatarUrl: profile.avatar_url ?? null,
        birthdate: profile.birthdate ?? null,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ children });
}
