import { fetchTemplateById } from '@/lib/templates.server'
import EditForm from '../EditForm'
import Link from 'next/link'
import { ClientDeleteButton } from '../../ClientDeleteButton'
import { Txt } from '../../Strings'

export const dynamic = 'force-dynamic'

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const tpl = await fetchTemplateById(params.id)
  if (!tpl) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold"><Txt k="admin.templates.notFound" /></h1>
      </div>
    )
  }
  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold"><Txt k="admin.templates.form.editTitle" /></h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/templates" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"><Txt k="common.back" /></Link>
          <ClientDeleteButton id={tpl.id} />
        </div>
      </div>
      <EditForm initial={tpl} />
    </div>
  )
}

