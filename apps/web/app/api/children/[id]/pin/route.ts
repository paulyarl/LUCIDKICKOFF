import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";
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

    const supabase = createServiceClient();

    if (auth.role !== "admin") {
      const { data: guardian } = await supabase
        .from("child_guardians")
        .select("role")
        .eq("child_profile_id", params.id)
        .eq("guardian_id", auth.userId)
        .maybeSingle();
      if (!guardian) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("child_profiles")
      .update({
        pin_hash: hashPin(pin),
        pin_length: pin.length,
        pin_failed_attempts: 0,
        pin_locked_until: null,
      } as any)
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not set PIN" },
      { status: 500 },
    );
  }
}
