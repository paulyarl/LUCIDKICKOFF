import { requireRole } from '@/lib/auth/requireRole';
import { listUsersByRole } from '@/lib/admin';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { T } from '@/components/i18n/T';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export const dynamic = 'force-dynamic';

export default async function AdminChildrenPage() {
  await requireRole(['admin']);
  const children = await listUsersByRole('child');
  return (
    <section className="container py-8 space-y-6">
      <AdminHeader titleKey="admin.children.title" />
      <AdminBreadcrumbs items={[{ labelKey: 'admin.index.title', href: '/admin' }, { labelKey: 'admin.children.title' }]} />

      <div className="space-y-3">
        {children.length === 0 && (
          <p className="text-sm text-muted-foreground"><T k="admin.children.empty" /></p>
        )}
        {children.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 border rounded">
            <div className="truncate" title={c.email}>{c.email}</div>
            <Link href={`/admin/child/${c.id}`} className="text-blue-600 hover:underline"><T k="admin.children.manage" /></Link>
          </div>
        ))}
      </div>
    </section>
  );
}
