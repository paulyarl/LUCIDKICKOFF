import { requireRole } from "@/lib/auth/requireRole";
import { createTemplateFromUpload } from "@/lib/templates.server";
import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import { T } from "@/components/i18n/T";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  await requireRole(["admin"]);

  const supabase = createClient();
  const { data: entitlements } = await supabase
    .from("entitlements_catalog")
    .select("code,label")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  return (
    <section className="mx-auto max-w-xl px-6 py-10 space-y-6">
      <AdminBreadcrumbs
        items={[
          { labelKey: "nav.admin", href: "/admin" },
          { labelKey: "admin.templates.title", href: "/admin/templates" },
          { labelKey: "admin.templates.new" },
        ]}
      />
      <AdminHeader titleKey="admin.templates.new" />
      <form action={createTemplateFromUpload} className="space-y-4" encType="multipart/form-data">
        <div>
          <label className="block text-sm font-medium mb-1"><T k="admin.templates.form.fields.title" /></label>
          <input name="title" type="text" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1"><T k="admin.templates.form.fields.image" /></label>
          <input name="file" type="file" accept="image/png,image/*" className="w-full" required />
        </div>
        <div className="flex items-center gap-2">
          <input id="is_free" name="is_free" type="checkbox" defaultChecked />
          <label htmlFor="is_free" className="text-sm"><T k="admin.templates.form.fields.isFree" /></label>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1"><T k="admin.templates.form.fields.entitlement" /></label>
            <a href="/admin/entitlements" className="text-xs text-brand-teal hover:underline"><T k="admin.entitlements.manageLink" /></a>
          </div>
          <select name="required_entitlement" className="w-full rounded border px-3 py-2 bg-white" defaultValue="">
            <option value=""><T k="admin.templates.form.fields.entitlementNone" /></option>
            {(entitlements || []).map((e: any) => (
              <option key={e.code} value={e.code}>{e.label || e.code}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-brand-navy/50"><T k="admin.templates.form.fields.entitlementHint" /></p>
        </div>
        <p className="text-xs text-brand-navy/50"><T k="admin.templates.form.categoriesHint" /></p>
        <div className="flex gap-3">
          <button type="submit" className="inline-flex items-center rounded-md bg-brand-navy px-4 py-2 text-white hover:bg-brand-navy/90">
            <T k="admin.templates.form.buttons.create" />
          </button>
          <a href="/admin/templates" className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-brand-cream">
            <T k="admin.templates.form.buttons.cancel" />
          </a>
        </div>
      </form>
    </section>
  );
}
