import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getTrustedGuardianId } from "@/lib/auth/device-trust";

/**
 * E.2 — sessionless learner listing for trusted family devices (D58).
 * Reveals nickname/avatar/flags only, never credentials; the device cookie is
 * the sole authorization and it never grants anything beyond this listing.
 */
export async function GET() {
  const guardianId = await getTrustedGuardianId();
  if (!guardianId) {
    return NextResponse.json({ trusted: false, learners: [] });
  }

  const service = createServiceClient();
  const { data: links, error } = await service
    .from("child_guardians")
    .select("child_profile_id")
    .eq("guardian_id", guardianId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (links ?? []).map((row: any) => row.child_profile_id);
  if (ids.length === 0) {
    return NextResponse.json({ trusted: true, learners: [] });
  }

  const { data: profiles, error: profileError } = await service
    .from("child_profiles")
    .select("id, nickname, avatar_url, birthdate, pin_hash, auth_user_id")
    .in("id", ids)
    .eq("active", true);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const learners = (profiles ?? []).map((row: any) => ({
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    birthdate: row.birthdate,
    hasPin: Boolean(row.pin_hash),
    hasPassword: Boolean(row.auth_user_id),
  }));

  return NextResponse.json({ trusted: true, learners });
}
