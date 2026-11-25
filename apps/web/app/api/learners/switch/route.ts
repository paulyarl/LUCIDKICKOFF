import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyPin } from "@/lib/auth/pin";
import { signImpersonation, IMPERSONATION_COOKIE, IMPERSONATION_COOKIE_OPTIONS } from "@/lib/auth/impersonation";
import { getTrustedGuardianId } from "@/lib/auth/device-trust";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  pin_hash: string | null;
  pin_failed_attempts: number | null;
  pin_locked_until: string | null;
};

/**
 * PIN verification with attempt counting + lockout (D23). Returns a
 * NextResponse describing the failure, or null when the PIN is correct
 * (in which case the attempt counters are reset).
 */
async function verifyPinWithLockout(
  supabase: ReturnType<typeof createServiceClient>,
  profile: ProfileRow,
  pin: string,
): Promise<NextResponse | null> {
  if (!profile.pin_hash) {
    return NextResponse.json(
      { error: "PIN not set. Ask a guardian to set it." },
      { status: 403 },
    );
  }
  if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 423 },
    );
  }
  if (!verifyPin(pin, profile.pin_hash)) {
    const attempts = (profile.pin_failed_attempts ?? 0) + 1;
    const lockedUntil =
      attempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
    await supabase
      .from("child_profiles")
      .update({ pin_failed_attempts: attempts, pin_locked_until: lockedUntil } as any)
      .eq("id", profile.id);
    return NextResponse.json(
      { error: lockedUntil ? "Too many attempts. Try again later." : "Incorrect PIN." },
      { status: lockedUntil ? 423 : 401 },
    );
  }

  await supabase
    .from("child_profiles")
    .update({ pin_failed_attempts: 0, pin_locked_until: null } as any)
    .eq("id", profile.id);
  return null;
}

export async function POST(req: Request) {
  // Soft auth: the cold-start path (D58) runs without a session, authorized
  // by device trust + PIN instead. Session callers use the original paths.
  const userClient = createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  const auth = user
    ? { userId: user.id, role: (user.app_metadata as any)?.role as string | undefined }
    : null;

  const body = await req.json().catch(() => null);
  const profileId = typeof body?.child_profile_id === "string" ? body.child_profile_id : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!profileId) return NextResponse.json({ error: "child_profile_id is required" }, { status: 400 });

  const supabase = createServiceClient();

  // ---- Cold start (D58): authorization is proven BEFORE existence is revealed,
  // so the 404/401 difference cannot be used as a profile-id oracle.
  let coldGuardianId: string | null = null;
  if (!auth) {
    coldGuardianId = await getTrustedGuardianId();
    if (!coldGuardianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: ownership } = await supabase
      .from("child_guardians")
      .select("guardian_id")
      .eq("child_profile_id", profileId)
      .eq("guardian_id", coldGuardianId)
      .maybeSingle();
    if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profileData, error } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !profileData) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }
  const profile = profileData as unknown as ProfileRow;

  let authorizingGuardianId: string | null = null;

  if (!auth) {
    const pinFailure = await verifyPinWithLockout(supabase, profile, pin);
    if (pinFailure) return pinFailure;
    authorizingGuardianId = coldGuardianId;

    const cookieStore = await cookies();
    const token = signImpersonation({
      userId: profile.auth_user_id ?? profile.id,
      profileId: profile.id,
      guardianId: authorizingGuardianId,
      admin: false,
    });
    cookieStore.set(IMPERSONATION_COOKIE, token, IMPERSONATION_COOKIE_OPTIONS);
    return NextResponse.json({ ok: true, redirect: "/child" });
  }

  if (auth.role === "child") {
    const pinFailure = await verifyPinWithLockout(supabase, profile, pin);
    if (pinFailure) return pinFailure;

    // A child may only switch to a sibling under the same guardian.
    const { data: caller } = await supabase
      .from("child_profiles")
      .select("id")
      .eq("auth_user_id", auth.userId)
      .maybeSingle();
    if (caller) {
      const { data: callerGuardians } = await supabase
        .from("child_guardians")
        .select("guardian_id")
        .eq("child_profile_id", (caller as any).id);
      const { data: targetGuardians } = await supabase
        .from("child_guardians")
        .select("guardian_id")
        .eq("child_profile_id", profile.id);
      const callerIds = new Set((callerGuardians ?? []).map((row: any) => row.guardian_id));
      const sharedGuardian = (targetGuardians ?? []).find((row: any) => callerIds.has(row.guardian_id));
      if (!sharedGuardian) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      authorizingGuardianId = sharedGuardian.guardian_id;
    }

  } else if (auth.role !== "admin") {
    const { data: guardian } = await supabase
      .from("child_guardians")
      .select("role")
      .eq("child_profile_id", profile.id)
      .eq("guardian_id", auth.userId)
      .maybeSingle();
    if (!guardian) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    authorizingGuardianId = auth.userId;
  } else {
    authorizingGuardianId = auth.userId;
  }

  const cookieStore = await cookies();
  const token = signImpersonation({
    userId: profile.auth_user_id ?? profile.id,
    profileId: profile.id,
    guardianId: authorizingGuardianId,
    admin: auth.role === "admin",
  });
  cookieStore.set(IMPERSONATION_COOKIE, token, IMPERSONATION_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true, redirect: "/child" });
}
