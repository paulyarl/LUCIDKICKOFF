import { requireRole } from "@/lib/auth/requireRole";
import AdminLinks from "./AdminLinks";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  await requireRole(["admin"]);
  return (
    <section className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <AdminHeader titleKey="admin.index.title" />
      <AdminBreadcrumbs items={[{ labelKey: "admin.index.title" }]} />
      <AdminLinks />
    </section>
  );
}
