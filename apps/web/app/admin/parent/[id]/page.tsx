import { requireRole } from '@/lib/auth/requireRole';
import { getParentChildren, linkParentChild, unlinkParentChild, findUserByEmail } from '@/lib/admin';
import { notFound } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { T } from '@/components/i18n/T';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

async function doLink(parentId: string, formData: FormData) {
  'use server';
  if (!parentId) return;
  const childEmail = (formData.get('childEmail') as string) || null;
  const childId = (formData.get('childId') as string) || null;
  const child = childId ? { id: childId } : (childEmail ? await findUserByEmail(childEmail) : null);
  if (!child?.id) return;
  await linkParentChild(parentId, child.id);
}

async function doUnlink(parentId: string, childId: string) {
  'use server';
  if (!parentId || !childId) return;
  await unlinkParentChild(parentId, childId);
}

export default async function AdminParentDetailPage({ params }: { params: { id: string } }) {
  await requireRole(['admin']);
  const parentId = params.id;
  if (!parentId) notFound();
  const children = await getParentChildren(parentId);

  return (
    <section className="container py-12 space-y-8">
      <AdminHeader titleKey="admin.parent.detail.title" />
      <AdminBreadcrumbs items={[{ labelKey: 'admin.index.title', href: '/admin' }, { labelKey: 'admin.parent.detail.title' }]} />
      <p className="text-sm text-muted-foreground break-all">ID: {parentId}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4"><T k="admin.parent.linkedChildren" /></h2>
          <div className="space-y-3">
            {children.length === 0 && (
              <p className="text-sm text-muted-foreground"><T k="admin.parent.linkedChildren.empty" /></p>
            )}
            {children.map((c) => (
              <form key={c.id} action={doUnlink.bind(null, parentId, c.id)} className="flex items-center justify-between p-3 border rounded gap-3">
                <div className="truncate" title={c.email}>{c.email}</div>
                <Button type="submit" variant="destructive" className="h-8 py-1"><T k="admin.parent.unlink" /></Button>
              </form>
            ))}
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4"><T k="admin.parent.link.title" /></h2>
          <form action={doLink.bind(null, parentId)} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1"><T k="admin.parent.link.childEmail" /></label>
              <input name="childEmail" type="email" className="w-full rounded-md border px-3 py-2" placeholder="child@example.com" />
            </div>
            <div className="text-center text-sm text-muted-foreground"><T k="admin.parent.link.or" /></div>
            <div>
              <label className="block text-sm font-medium mb-1"><T k="admin.parent.link.childId" /></label>
              <input name="childId" type="text" className="w-full rounded-md border px-3 py-2" placeholder="uuid" />
            </div>
            <Button type="submit" variant="default"><T k="admin.parent.link.submit" /></Button>
          </form>
        </div>
      </div>
    </section>
  );
}

