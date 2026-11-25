import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";

/**
 * S3.3 / D32 — family-wide cloud-sync consent. A consent_records row with
 * purpose='cloud_sync' and child_profile_id NULL covers every child the
 * guardian manages; has_sync_consent() matches that in the ingest path.
 * Grant inserts a row; withdraw stamps withdrawn_at on active rows
 * (records are kept for audit).
 */

const POLICY_VERSION = "v1";

export async function GET() {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.supabase
    .from("consent_records")
    .select("id")
    .eq("guardian_id", auth.userId)
    .eq("purpose", "cloud_sync")
    .is("child_profile_id", null)
    .is("withdrawn_at", null)
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ consent: (data?.length ?? 0) > 0 });
}

export async function POST(req: Request) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (typeof body?.consent !== "boolean") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!body.consent) {
    const { error } = await auth.supabase
      .from("consent_records")
      .update({ withdrawn_at: new Date().toISOString() })
      .eq("guardian_id", auth.userId)
      .eq("purpose", "cloud_sync")
      .is("child_profile_id", null)
      .is("withdrawn_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ consent: false });
  }

  // Idempotent grant: skip insert when an active family-wide consent exists.
  const { data: existing } = await auth.supabase
    .from("consent_records")
    .select("id")
    .eq("guardian_id", auth.userId)
    .eq("purpose", "cloud_sync")
    .is("child_profile_id", null)
    .is("withdrawn_at", null)
    .limit(1);
  if (existing?.length) return NextResponse.json({ consent: true });

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("jurisdiction")
    .eq("id", auth.userId)
    .maybeSingle();

  const { error } = await auth.supabase.from("consent_records").insert({
    guardian_id: auth.userId,
    child_profile_id: null,
    jurisdiction: (profile?.jurisdiction as string) ?? "TZ",
    purpose: "cloud_sync",
    policy_version: POLICY_VERSION,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ consent: true });
}
