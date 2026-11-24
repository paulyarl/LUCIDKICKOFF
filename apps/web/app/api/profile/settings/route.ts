import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", auth.userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: (data as any)?.settings ?? {} });
}

export async function PATCH(req: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return NextResponse.json({ error: "invalid settings patch" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", auth.userId)
    .single();

  const settings = {
    ...(((current as any)?.settings as Record<string, unknown>) ?? {}),
    ...(patch as Record<string, unknown>),
  };

  const { error } = await supabase
    .from("profiles")
    .update({ settings } as any)
    .eq("id", auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings });
}
