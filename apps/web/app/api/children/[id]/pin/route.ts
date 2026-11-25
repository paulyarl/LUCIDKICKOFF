import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/server";
import { hashPin } from "@/lib/auth/pin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiUser(["parent", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => null);
    const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4–6 digits" }, { status: 400 });
    }

    await db
      .user({ userId: auth.userId, role: auth.role })
      .children.setPin(params.id, hashPin(pin), pin.length);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not set PIN" },
      { status: 500 },
    );
  }
}
