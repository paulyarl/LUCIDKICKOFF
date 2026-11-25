import { requireRole } from "@/lib/auth/requireRole";
import { fetchAllTemplates } from "@/lib/templates.server";
import { TemplatesManager } from "@/apps/web/components/templates/TemplatesManager";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await requireRole(['admin']);
  const templates = await fetchAllTemplates();
  return (
    <section className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <AdminBreadcrumbs
        items={[
          { labelKey: "nav.admin", href: "/admin" },
          { labelKey: "admin.templates.title" },
        ]}
      />
      <AdminHeader titleKey="admin.templates.title" />
      <TemplatesManager initialTemplates={templates} editable={true} />
    </section>
  );
}
