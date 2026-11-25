import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * E.1 — trusted family device (D58).
 * The cookie proves only one thing: "a guardian signed in on this device at
 * some point." It authorizes NOTHING beyond listing the learner picker.
 */

export const DEVICE_TRUST_COOKIE = "lc_device";
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // ~1 year

const SECRET =
  process.env.IMPERSONATION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "dev-only-impersonation-secret";

export type DeviceTrustPayload = {
  guardianId: string;
  version: number;
  exp: number;
};

export function signDeviceTrust(input: Omit<DeviceTrustPayload, "exp">): string {
  const payload: DeviceTrustPayload = { ...input, exp: Date.now() + TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyDeviceTrust(token: string | undefined | null): DeviceTrustPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as DeviceTrustPayload;
    if (!payload?.guardianId || !payload?.exp || payload.exp < Date.now()) return null;
    if (typeof payload.version !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

export const DEVICE_TRUST_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: Math.floor(TTL_MS / 1000),
};

/**
 * Reads the device cookie, verifies signature + expiry, and re-validates the
 * per-guardian revocation version against the profiles row on every call —
 * bumping `device_trust_version` invalidates every minted cookie at once.
 * Returns the guardian id when the device is trusted, null otherwise.
 */
export async function getTrustedGuardianId(): Promise<string | null> {
  const cookieStore = await cookies();
  const payload = verifyDeviceTrust(cookieStore.get(DEVICE_TRUST_COOKIE)?.value);
  if (!payload) return null;

  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("device_trust_version")
    .eq("id", payload.guardianId)
    .maybeSingle();

  const current = (data as { device_trust_version?: number } | null)?.device_trust_version ?? 1;
  return payload.version === current ? payload.guardianId : null;
}
