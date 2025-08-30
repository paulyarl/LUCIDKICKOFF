import Link from 'next/link'
import { fetchAllTemplates } from '@/lib/templates.server'
import { Txt, FreePremium } from './Strings'

export const dynamic = 'force-dynamic'

export default async function TemplatesAdminPage() {
  const templates = await fetchAllTemplates()
  return (
    <div className="px-6 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight"><Txt k="admin.templates.title" /></h1>
          <p className="mt-1 text-sm text-gray-500">Manage drawing templates, visibility, and assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/entitlements"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            title="Manage entitlements catalog"
          >
            Manage entitlements
          </Link>
          <Link
            href="/admin/templates/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Txt k="admin.templates.new" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total Templates</div>
          <div className="mt-1 text-2xl font-semibold">{templates.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Free</div>
          <div className="mt-1 text-2xl font-semibold">{templates.filter(t => t.is_free).length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Premium</div>
          <div className="mt-1 text-2xl font-semibold">{templates.filter(t => !t.is_free).length}</div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {templates.length === 0 && (
          <p className="text-sm text-gray-500"><Txt k="admin.templates.none" /></p>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            className="group flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                {/* Placeholder thumb: could be replaced with real preview when available */}
                <span className="text-xs text-gray-400">SVG</span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-medium">{t.title}</div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.is_free ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' : 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200'}`}>
                    <FreePremium isFree={t.is_free} />
                  </span>
                  {!t.is_free && (t as any).required_entitlement && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                      {(t as any).required_entitlement}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{t.image_path}</div>
                {t.tags && t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/templates/edit/${t.id}`}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <Txt k="admin.templates.edit" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

