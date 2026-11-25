import { NextResponse } from "next/server";
import { ingestAnalyticsEvents } from "@/lib/analytics/ingest";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return ingestAnalyticsEvents(req, null);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
