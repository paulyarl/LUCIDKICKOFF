import { requireRole } from "@/lib/auth/requireRole";
import { fetchTemplateById } from '@/lib/templates.server'
import { createClient } from '@/lib/supabase/server'
import EditForm from '../EditForm'
import Link from 'next/link'
import { ClientDeleteButton } from '../../ClientDeleteButton'
import { T } from '@/components/i18n/T'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'

export const dynamic = 'force-dynamic'

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  await requireRole(['admin'])
  const tpl = await fetchTemplateById(params.id)
  // Fetch active entitlements for dropdown
  const supabase = createClient()
  const { data: entitlements } = await supabase
    .from('entitlements_catalog')
    .select('code,label,active,sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('code', { ascending: true })
  if (!tpl) {
    return (
      <div className="container py-8 space-y-6">
        <AdminHeader titleKey="admin.templates.title" />
        <AdminBreadcrumbs items={[
          { labelKey: 'admin.index.title', href: '/admin' }, 
          { labelKey: 'admin.templates.title', href: '/admin/templates' },
          { labelKey: 'admin.templates.notFound' }
        ]} />
        <div className="p-6">
          <h1 className="text-xl font-semibold"><T k="admin.templates.notFound" /></h1>
        </div>
      </div>
    )
  }
  return (
    <div className="container py-8 space-y-6">
      <AdminHeader titleKey="admin.templates.form.editTitle" />
      <AdminBreadcrumbs items={[
        { labelKey: 'admin.index.title', href: '/admin' }, 
        { labelKey: 'admin.templates.title', href: '/admin/templates' },
        { labelKey: 'admin.templates.form.editTitle' }
      ]} />
      <div className="max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold"><T k="admin.templates.form.editTitle" /></h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/templates" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"><T k="common.back" /></Link>
            <ClientDeleteButton id={tpl.id} />
          </div>
        </div>
        <EditForm initial={tpl} entitlements={(entitlements || []).map(e => ({ code: e.code, label: e.label }))} />
      </div>
    </div>
  )
}
