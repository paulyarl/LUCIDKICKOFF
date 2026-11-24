import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import { Button } from "@/components/ui/button";
import { signImpersonation, IMPERSONATION_COOKIE, IMPERSONATION_COOKIE_OPTIONS } from "@/lib/auth/impersonation";
import AdminUserPicker from "@/components/admin/AdminUserPicker";

export const dynamic = "force-dynamic";

async function setImpersonation(formData: FormData) {
  "use server";
  await requireRole(["admin"]);
  const userId = (formData.get("userId") as string)?.trim();
  if (userId) {
    const c = await cookies();
    c.set(
      IMPERSONATION_COOKIE,
      signImpersonation({ userId, admin: true }),
      IMPERSONATION_COOKIE_OPTIONS,
    );
  }
  redirect("/parent");
}

async function clearImpersonation() {
  "use server";
  await requireRole(["admin"]);
  const c = await cookies();
  c.delete("impersonate_user_id");
  redirect("/admin");
}

export default async function ImpersonateParentsPage() {
  await requireRole(["admin"]);
  return (
    <section className="container py-8 space-y-6">
      <AdminHeader titleKey="admin.impersonate.parent.title" />
      <AdminBreadcrumbs items={[{ labelKey: "admin.index.title", href: "/admin" }, { labelKey: "admin.impersonate.parent.title" }]} />
      <form action={setImpersonation} className="space-y-4 max-w-md">
        <AdminUserPicker label="Parent Email" name="userId" role="parent" placeholder="email@domain.com" />
        <Button type="submit" variant="default">Impersonate</Button>
      </form>
      <form action={clearImpersonation}>
        <Button type="submit" variant="outline">Stop Impersonating</Button>
      </form>
    </section>
  );
}

