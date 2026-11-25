import { redirect } from "next/navigation";
import { db } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function DashboardRouter() {
  const session = await db.auth().session();

  if (!session?.user) redirect("/welcome");

  const role = (session.user.app_metadata as any)?.role;
  if (role === "admin") redirect("/admin");
  if (role === "parent") redirect("/parent");
  redirect("/child");
}
