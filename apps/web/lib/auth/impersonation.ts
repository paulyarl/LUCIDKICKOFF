import { createHmac, timingSafeEqual } from "crypto";

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
