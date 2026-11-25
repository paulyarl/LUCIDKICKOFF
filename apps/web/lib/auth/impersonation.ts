import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export const IMPERSONATION_COOKIE = "impersonate_session";
const TTL_MS = 4 * 60 * 60 * 1000;

const SECRET =
  process.env.IMPERSONATION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "dev-only-impersonation-secret";

export type ImpersonationPayload = {
  userId: string;
  profileId?: string | null;
  guardianId?: string | null;
  admin?: boolean;
  exp: number;
};

export function signImpersonation(
  input: Omit<ImpersonationPayload, "exp">,
): string {
  const payload: ImpersonationPayload = { ...input, exp: Date.now() + TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyImpersonation(
  token: string | undefined | null,
): ImpersonationPayload | null {
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
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as ImpersonationPayload;
    if (!payload?.userId || !payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const IMPERSONATION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 4,
};

/**
 * Verifies the impersonation cookie AND re-validates the issuer's
 * authorization on every request (S4.5 privacy gate):
 * - guardian cookies: the guardian→child link must still exist
 * - admin cookies: the recorded issuer must still hold the admin role
 * Returns null for unsigned/expired/unverifiable or revoked cookies.
 */
export async function getValidatedImpersonation(): Promise<ImpersonationPayload | null> {
  const cookieStore = await cookies();
  const payload = verifyImpersonation(cookieStore.get(IMPERSONATION_COOKIE)?.value);
  if (!payload) return null;

  const service = createServiceClient();
  if (payload.admin) {
    // Issuer identity is required to re-validate; cookies minted before
    // issuer tracking was added are rejected and must be re-issued.
    if (!payload.guardianId) return null;
    const { data } = await service.auth.admin.getUserById(payload.guardianId);
    const role = (data?.user?.app_metadata as Record<string, unknown> | undefined)?.role;
    return role === "admin" ? payload : null;
  }

  if (!payload.guardianId || !payload.profileId) return null;
  const { data: link } = await service
    .from("child_guardians")
    .select("guardian_id")
    .eq("guardian_id", payload.guardianId)
    .eq("child_profile_id", payload.profileId)
    .maybeSingle();
  return link ? payload : null;
}
