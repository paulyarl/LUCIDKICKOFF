import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) redirect("/welcome");

  const role = (session.user.app_metadata as any)?.role;
  if (role === "admin") redirect("/admin");
  if (role === "parent") redirect("/parent");
  redirect("/child");
}
