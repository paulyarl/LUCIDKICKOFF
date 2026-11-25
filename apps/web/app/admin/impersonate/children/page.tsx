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
  const auth = await requireRole(["admin"]);
  const userId = (formData.get("userId") as string)?.trim();
  if (userId) {
    const c = await cookies();
    c.set(
      IMPERSONATION_COOKIE,
      signImpersonation({ userId, guardianId: auth.userId, admin: true }),
      IMPERSONATION_COOKIE_OPTIONS,
    );
  }
  redirect("/child");
}

async function clearImpersonation() {
  "use server";
  await requireRole(["admin"]);
  const c = await cookies();
  c.delete("impersonate_user_id");
  redirect("/admin");
}

export default async function ImpersonateChildrenPage() {
  await requireRole(["admin"]);
  return (
    <section className="container py-8 space-y-6">
      <AdminHeader titleKey="admin.impersonate.child.title" />
      <AdminBreadcrumbs items={[{ labelKey: "admin.index.title", href: "/admin" }, { labelKey: "admin.impersonate.child.title" }]} />
      <form action={setImpersonation} className="space-y-4 max-w-md">
        <AdminUserPicker
          label="Child"
          name="userId"
          role="child"
          placeholder="Search child email…"
        />
        <Button type="submit" variant="default">Impersonate</Button>
      </form>
      <form action={clearImpersonation}>
        <Button type="submit" variant="outline">Stop Impersonating</Button>
      </form>
    </section>
  );
}

