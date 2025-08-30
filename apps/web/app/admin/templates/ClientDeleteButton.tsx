"use client"

import React from 'react'
import { useI18n } from '@/lib/i18n/provider'
import { deleteTemplate } from '@/lib/templates'
import { useRouter } from 'next/navigation'

export function ClientDeleteButton({ id }: { id: string }) {
  const { t } = useI18n()
  const router = useRouter()
  
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = confirm(t('admin.templates.confirmDelete'))
        if (!ok) return
        try {
          await deleteTemplate(id)
          router.push('/admin/templates')
        } catch (e: any) {
          alert(e?.message ?? t('admin.templates.errorDelete'))
        }
      }}
      className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {t('admin.templates.delete')}
    </button>
  )
}
