import { requireRole } from '@/lib/auth/requireRole';
import { getChildParents, linkParentChild, unlinkParentChild, findUserByEmail } from '@/lib/admin';
import { notFound } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { T } from '@/components/i18n/T';
import { Button } from '@/components/ui/button';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function doLink(childId: string, formData: FormData) {
  'use server';
  if (!childId) return;
  const parentEmail = (formData.get('parentEmail') as string) || null;
  const parentId = (formData.get('parentId') as string) || null;
  const parent = parentId ? { id: parentId } : (parentEmail ? await findUserByEmail(parentEmail) : null);
  if (!parent?.id) return;
  await linkParentChild(parent.id, childId);
}

async function doUnlink(childId: string, parentId: string) {
  'use server';
  if (!childId || !parentId) return;
  await unlinkParentChild(parentId, childId);
}

async function doUpdateProfile(childId: string, formData: FormData) {
  'use server';
  if (!childId) return;
  const supabase = createServiceClient();
  const full_name = ((formData.get('full_name') as string) || '').trim() || null;
  const username = ((formData.get('username') as string) || '').trim() || null;
  const birthdate = ((formData.get('birthdate') as string) || '').trim() || null; // format: YYYY-MM-DD
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: childId, full_name, username, birthdate }, { onConflict: 'id' });
  if (error) throw error;
}

export default async function AdminChildDetailPage({ params }: { params: { id: string } }) {
  await requireRole(['admin']);
  const childId = params.id;
  if (!childId) notFound();
  const parents = await getChildParents(childId);
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, birthdate')
    .eq('id', childId)
    .maybeSingle();

  return (
    <section className="container py-12 space-y-8">
      <AdminHeader titleKey="admin.child.detail.title" />
      <AdminBreadcrumbs items={[{ labelKey: 'admin.index.title', href: '/admin' }, { labelKey: 'admin.child.detail.title' }]} />
      <p className="text-sm text-muted-foreground break-all">ID: {childId}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4"><T k="admin.child.linkedParents" /></h2>
          <div className="space-y-3">
            {parents.length === 0 && (
              <p className="text-sm text-muted-foreground"><T k="admin.child.linkedParents.empty" /></p>
            )}
            {parents.map((p) => (
              <form key={p.id} action={doUnlink.bind(null, childId, p.id)} className="flex items-center justify-between p-3 border rounded gap-3">
                <div className="truncate" title={p.email}>{p.email}</div>
                <Button type="submit" variant="destructive" className="h-8 py-1"><T k="admin.child.unlink" /></Button>
              </form>
            ))}
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4"><T k="admin.child.link.title" /></h2>
          <form action={doLink.bind(null, childId)} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1"><T k="admin.child.link.parentEmail" /></label>
              <input name="parentEmail" type="email" className="w-full rounded-md border px-3 py-2" placeholder="parent@example.com" />
            </div>
            <div className="text-center text-sm text-muted-foreground"><T k="admin.child.link.or" /></div>
            <div>
              <label className="block text-sm font-medium mb-1"><T k="admin.child.link.parentId" /></label>
              <input name="parentId" type="text" className="w-full rounded-md border px-3 py-2" placeholder="uuid" />
            </div>
            <Button type="submit" variant="default"><T k="admin.child.link.submit" /></Button>
          </form>
        </div>

        <div className="p-6 border rounded-lg md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Child Profile</h2>
          <form action={doUpdateProfile.bind(null, childId)} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input name="full_name" type="text" className="w-full rounded-md border px-3 py-2" defaultValue={profile?.full_name || ''} placeholder="Alex Johnson" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input name="username" type="text" className="w-full rounded-md border px-3 py-2" defaultValue={profile?.username || ''} placeholder="alexj" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Birthdate</label>
              <input name="birthdate" type="date" className="w-full rounded-md border px-3 py-2" defaultValue={profile?.birthdate || ''} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" variant="default">Save Profile</Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

