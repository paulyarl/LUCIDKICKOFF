// Sprint 2.15 — connectivity heartbeat probe target. Kept trivially cheap.
// IMPORTANT: the SW never caches this route (see sw.js /api/health branch) —
// a cached 200 would report "online" while the device is offline.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true });
}
