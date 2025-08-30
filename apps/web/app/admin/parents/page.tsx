import { requireRole } from '@/lib/auth/requireRole';
import { listUsersByRole } from '@/lib/admin';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { T } from '@/components/i18n/T';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export const dynamic = 'force-dynamic';

export default async function AdminParentsPage() {
  await requireRole(['admin']);
  const parents = await listUsersByRole('parent');
  return (
    <section className="container py-8 space-y-6">
      <AdminHeader titleKey="admin.parents.title" />
      <AdminBreadcrumbs items={[{ labelKey: 'admin.index.title', href: '/admin' }, { labelKey: 'admin.parents.title' }]} />

      <div className="space-y-3">
        {parents.length === 0 && (
          <p className="text-sm text-muted-foreground"><T k="admin.parents.empty" /></p>
        )}
        {parents.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3 border rounded">
            <div className="truncate" title={p.email}>{p.email}</div>
            <Link href={`/admin/parent/${p.id}`} className="text-blue-600 hover:underline"><T k="admin.parents.manage" /></Link>
          </div>
        ))}
      </div>
    </section>
  );
}
