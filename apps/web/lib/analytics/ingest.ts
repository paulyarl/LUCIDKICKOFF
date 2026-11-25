import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

type RawEvent = {
  id?: string;
  name?: string;
  event?: string;
  timestamp?: string | number;
  session_id?: string;
  user_id?: string;
  [k: string]: unknown;
};

const MAX_BATCH = 200;

function normalize(body: unknown): RawEvent[] {
  if (Array.isArray(body)) return body as RawEvent[];
  const events = (body as { events?: unknown[] })?.events;
  return Array.isArray(events) ? (events as RawEvent[]) : [];
}

function toTimestamp(v: RawEvent["timestamp"]): string | null {
  if (v == null) return null;
  if (typeof v === "number") return new Date(v).toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function ingestAnalyticsEvents(req: Request, channel: string | null) {
  const body = await req.json().catch(() => null);
  const events = normalize(body).slice(0, MAX_BATCH);
  if (events.length === 0) {
    return NextResponse.json({ ok: true, ingested: 0 });
  }

  // Best-effort caller identity; anonymous sessions ingest with null user_id
  // unless the event itself carries one.
  let callerId: string | null = null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    callerId = data.user?.id ?? null;
  } catch {
    callerId = null;
  }

  const rows = events.map((e) => ({
    occurred_at: toTimestamp(e.timestamp),
    user_id: e.user_id ?? callerId,
    session_id: typeof e.session_id === "string" ? e.session_id : null,
    name: (typeof e.name === "string" && e.name) || (typeof e.event === "string" && e.event) || "unknown",
    channel,
    payload: e,
  }));

  const { error } = await (createServiceClient() as any)
    .from("analytics_events")
    .insert(rows);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ingested: rows.length });
}
