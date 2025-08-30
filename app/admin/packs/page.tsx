import Link from 'next/link'
import { fetchAllPacks } from '@/lib/packs'
import { Txt, FreePremium } from './Strings'
import { ClientDeleteButton } from './ClientDeleteButton'

export const dynamic = 'force-dynamic'

export default async function PacksAdminPage() {
  const packs = await fetchAllPacks()
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold"><Txt k="admin.packs.title" /></h1>
        <Link
          href="/admin/packs/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Txt k="admin.packs.new" />
        </Link>
      </div>

      <div className="grid gap-4">
        {packs.length === 0 && (
          <p className="text-sm text-gray-500"><Txt k="admin.packs.none" /></p>
        )}
        {packs.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-1">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-500">slug: {p.slug}</div>
              <div className="text-xs text-gray-500">{p.cover_path ?? '—'}</div>
              <div className="text-xs text-gray-500">
                <FreePremium isFree={p.is_free} /> {p.tags && p.tags.length > 0 ? `• ${p.tags.join(', ')}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/packs/edit/${p.id}`}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <Txt k="admin.packs.edit" />
              </Link>
              <ClientDeleteButton id={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
