import { requireRole } from '@/lib/auth/requireRole'
import { createClient } from '@/lib/supabase/server'
import { upsertEntitlement, deleteEntitlement } from '@/lib/entitlements.server'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'
import { T } from '@/components/i18n/T'
import ExistingEntitlementsClient from './ExistingEntitlementsClient'

export const dynamic = 'force-dynamic'

export default async function EntitlementsAdminPage() {
  await requireRole(['admin'])
  const supabase = createClient()
  const { data: entitlements } = await supabase
    .from('entitlements_catalog')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('code', { ascending: true })

  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <AdminHeader titleKey="admin.entitlements.title" />
      <AdminBreadcrumbs items={[{ labelKey: 'admin.index.title', href: '/admin' }, { labelKey: 'admin.entitlements.title' }]} />

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3"><T k="admin.entitlements.addUpdate" /></h2>
        <form id="entitlement-upsert-form" action={upsertEntitlement} className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm mb-1"><T k="admin.entitlements.code" /></label>
            <input name="code" required className="w-full rounded border px-3 py-2" placeholder="gold" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm mb-1"><T k="admin.entitlements.label" /></label>
            <input name="label" required className="w-full rounded border px-3 py-2" placeholder="Gold" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1"><T k="admin.entitlements.description" /></label>
            <input name="description" className="w-full rounded border px-3 py-2" placeholder="Plan or pack description" />
          </div>
          <div>
            <label className="block text-sm mb-1"><T k="admin.entitlements.sortOrder" /></label>
            <input name="sort_order" type="number" defaultValue={0} className="w-full rounded border px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" name="active" type="checkbox" defaultChecked />
            <label htmlFor="active" className="text-sm"><T k="admin.entitlements.active" /></label>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"><T k="admin.entitlements.save" /></button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3"><T k="admin.entitlements.existing" /></h2>
        <ExistingEntitlementsClient
          entitlements={(entitlements || []) as any}
          deleteAction={deleteEntitlement}
          targetFormId="entitlement-upsert-form"
        />
      </section>
    </div>
  )
}
