"use client";

import { T } from '@/components/i18n/T'
import { useI18n } from '@/lib/i18n/provider'

type Entitlement = {
  code: string
  label: string
  description?: string | null
  sort_order: number
  active: boolean
}

export default function ExistingEntitlementsClient({
  entitlements,
  deleteAction,
  targetFormId = 'entitlement-upsert-form',
}: {
  entitlements: Entitlement[]
  deleteAction: (formData: FormData) => Promise<void>
  targetFormId?: string
}) {
  const { t } = useI18n()
  const handleEdit = (e: Entitlement) => {
    const form = document.getElementById(targetFormId) as HTMLFormElement | null
    if (!form) return
    (form.querySelector('[name="code"]') as HTMLInputElement).value = e.code;
    (form.querySelector('[name="label"]') as HTMLInputElement).value = e.label;
    (form.querySelector('[name="description"]') as HTMLInputElement).value = e.description || '';
    (form.querySelector('[name="sort_order"]') as HTMLInputElement).value = e.sort_order.toString();
    (form.querySelector('[name="active"]') as HTMLInputElement).checked = e.active;
    form.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="divide-y rounded border bg-white">
      {(entitlements || []).map((e) => (
        <div key={e.code} className="flex items-center justify-between p-3">
          <div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-900">{e.label}</span>
              <span className="ml-2 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-700 align-middle">
                {e.code}
              </span>
            </div>
            {e.description && (
              <div className="text-sm text-gray-600">{e.description}</div>
            )}
            <div className="text-xs text-gray-500">
              <T k="admin.entitlements.sortLabel" /> {e.sort_order} ·{' '}
              {e.active ? (
                <T k="admin.entitlements.activeLabel" />
              ) : (
                <T k="admin.entitlements.inactiveLabel" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleEdit(e)}
              className="inline-flex items-center rounded-md border bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              title={t('admin.entitlements.edit')}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span><T k="admin.entitlements.edit" /></span>
            </button>
            <form action={deleteAction} className="inline">
              <input type="hidden" name="code" value={e.code} />
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                title={t('admin.entitlements.delete')}
                onClick={(ev) => {
                  if (!confirm('Delete this entitlement?')) {
                    ev.preventDefault()
                  }
                }}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <T k="admin.entitlements.delete" />
              </button>
            </form>
          </div>
        </div>
      ))}
      {(!entitlements || entitlements.length === 0) && (
        <div className="p-4 text-sm text-gray-500">
          <T k="admin.entitlements.none" />
        </div>
      )}
    </div>
  )
}
