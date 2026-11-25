import { requireRole } from "@/lib/auth/requireRole";
import { db } from "@/lib/api/server";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireRole(["admin"]);
  const [cats, joins] = await Promise.all([
    db.catalog().categoriesAdmin(),
    db.catalog().contentCategoryIds(),
  ]);

  const counts = new Map<string, number>();
  joins.forEach((j: any) => {
    counts.set(j.category_id, (counts.get(j.category_id) ?? 0) + 1);
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <AdminBreadcrumbs
        items={[
          { labelKey: "nav.admin", href: "/admin" },
          { labelKey: "admin.categories.title" },
        ]}
      />
      <AdminHeader titleKey="admin.categories.title" />
      <CategoriesManager
        initialCategories={(cats ?? []) as any[]}
        counts={Object.fromEntries(counts)}
      />
    </section>
  );
}
