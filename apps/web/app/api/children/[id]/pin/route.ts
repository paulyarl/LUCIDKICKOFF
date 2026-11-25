import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/api/server";
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

    const user = db.user({ userId: auth.userId, role: auth.role });
    // params.id may be the auth user id or the child_profiles id — resolve to
    // the profile row first so the RPC receives the right key. Admins have no
    // read policy on child_profiles, so their lookup uses the service repo.
    const profile = await (auth.role === "admin" ? db.service() : user)
      .family.childContext({ anyId: params.id });
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    await user.children.setPin(profile.id, hashPin(pin), pin.length);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Supabase errors are plain objects, not Error instances — read .message
    // directly so the real reason reaches the client.
    const message =
      (error as { message?: string } | null)?.message ?? "Could not set PIN";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
