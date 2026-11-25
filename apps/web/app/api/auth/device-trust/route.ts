import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  signDeviceTrust,
  DEVICE_TRUST_COOKIE,
  DEVICE_TRUST_COOKIE_OPTIONS,
} from "@/lib/auth/device-trust";

/**
 * E.1 — mints device trust after a verified guardian sign-in (D58).
 * The endpoint itself performs no authorization decision: it simply converts
 * an existing verified parent session into a device cookie. Calling it is a
 * no-op for non-parents (children and guests never mint family trust).
 */
export async function POST() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "parent") {
    return NextResponse.json({ minted: false, reason: "not-a-guardian" });
  }

  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("device_trust_version")
    .eq("id", auth.userId)
    .maybeSingle();
  const version = (data as { device_trust_version?: number } | null)?.device_trust_version ?? 1;

  const token = signDeviceTrust({ guardianId: auth.userId, version });
  const res = NextResponse.json({ minted: true });
  res.cookies.set(DEVICE_TRUST_COOKIE, token, DEVICE_TRUST_COOKIE_OPTIONS);
  return res;
}
