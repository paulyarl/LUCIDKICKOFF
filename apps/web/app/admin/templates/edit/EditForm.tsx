"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Template } from '@/lib/templates'
import { updateTemplate } from '@/lib/templates'
import { useI18n } from '@/lib/i18n/provider'

type EntitlementOption = { code: string; label: string }

export default function EditForm({ initial, entitlements }: { initial: Template; entitlements: EntitlementOption[] }) {
  const router = useRouter()
  const { t } = useI18n()
  const [title, setTitle] = useState(initial.title)
  const [file, setFile] = useState<File | null>(null)
  const [isFree, setIsFree] = useState(initial.is_free)
  const [tags, setTags] = useState((initial.tags ?? []).join(', '))
  const [requiredEntitlement, setRequiredEntitlement] = useState<string | ''>(initial.required_entitlement ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updateTemplate(initial.id, {
        file: file ?? undefined,
        title,
        is_free: isFree,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        required_entitlement: requiredEntitlement || null,
      })
      router.push('/admin/templates')
    } catch (err: any) {
      setError(err?.message ?? t('admin.templates.form.errors.updateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('admin.templates.form.fields.title')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('admin.templates.form.fields.replaceImage')}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full"
        />
        <p className="mt-1 text-xs text-gray-500">Current: {initial.image_path}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="is_free"
          type="checkbox"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
        />
        <label htmlFor="is_free" className="text-sm">{t('admin.templates.form.fields.isFree')}</label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('admin.templates.form.fields.entitlement')}</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={requiredEntitlement}
          onChange={(e) => setRequiredEntitlement(e.target.value)}
        >
          <option value="">{t('admin.templates.form.fields.entitlementNone')}</option>
          {entitlements.map((opt) => (
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('admin.templates.form.fields.tags')}</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder={t('admin.templates.form.fields.tagsPlaceholder')}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t('admin.templates.form.buttons.saving') : t('admin.templates.form.buttons.save')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/templates')}
          className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          {t('admin.templates.form.buttons.cancel')}
        </button>
      </div>
    </form>
  )
}
