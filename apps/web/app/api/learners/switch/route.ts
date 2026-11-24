import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyPin } from "@/lib/auth/pin";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const profileId = typeof body?.child_profile_id === "string" ? body.child_profile_id : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!profileId) return NextResponse.json({ error: "child_profile_id is required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: profileData, error } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !profileData) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }
  const profile = profileData as unknown as {
    id: string;
    auth_user_id: string | null;
    pin_hash: string | null;
    pin_failed_attempts: number | null;
    pin_locked_until: string | null;
  };

  if (auth.role === "child") {
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
      const shared = (targetGuardians ?? []).some((row: any) => callerIds.has(row.guardian_id));
      if (!shared) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase
      .from("child_profiles")
      .update({ pin_failed_attempts: 0, pin_locked_until: null } as any)
      .eq("id", profile.id);
  } else if (auth.role !== "admin") {
    const { data: guardian } = await supabase
      .from("child_guardians")
      .select("role")
      .eq("child_profile_id", profile.id)
      .eq("guardian_id", auth.userId)
      .maybeSingle();
    if (!guardian) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const target = profile.auth_user_id ?? profile.id;
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 4,
  };
  cookieStore.set("impersonate_user_id", target, options);
  cookieStore.set("impersonate_profile_id", profile.id, options);

  return NextResponse.json({ ok: true, redirect: "/child" });
}
