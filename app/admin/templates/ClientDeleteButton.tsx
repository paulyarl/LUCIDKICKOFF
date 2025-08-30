"use client"

import React from 'react'
import { useI18n } from '@/lib/i18n/provider'
import { deleteTemplate } from '@/lib/templates'

export function ClientDeleteButton({ id }: { id: string }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = confirm(t('admin.templates.confirmDelete'))
        if (!ok) return
        try {
          await deleteTemplate(id)
          window.location.reload()
        } catch (e: any) {
          alert(e?.message ?? t('admin.templates.errorDelete'))
        }
      }}
      className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
    >
      {t('admin.templates.delete')}
    </button>
  )
}
