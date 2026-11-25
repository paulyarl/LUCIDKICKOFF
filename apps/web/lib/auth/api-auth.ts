import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAppRole, type AppRole } from "./roles";

export type ApiAuth = {
  userId: string;
  role: AppRole;
  supabase: ReturnType<typeof createServerClient>;
};

/** Route Handler guard. Returns a 401/403 response or the auth context. */
export async function requireApiUser(allowed?: AppRole[]): Promise<ApiAuth | NextResponse> {
  const supabase = createServerClient();
  // getUser() validates the token with the auth server; getSession() would
  // pass an expired JWT through to fail downstream as a masked error.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.app_metadata as any)?.role;
  if (!isAppRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (allowed && !allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: user.id, role, supabase };
}
