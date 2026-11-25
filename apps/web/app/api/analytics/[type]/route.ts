import { ingestAnalyticsEvents } from "@/lib/analytics/ingest";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { type: string } }) {
  return ingestAnalyticsEvents(req, params.type ?? null);
}
