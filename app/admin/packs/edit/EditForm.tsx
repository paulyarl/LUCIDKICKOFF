"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchPackById, updatePack } from '@/lib/packs'
import ItemsManager from './ItemsManager'
import { useI18n } from '@/lib/i18n/provider'

export default function EditPackForm({ id }: { id: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isFree, setIsFree] = useState(true)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // i18n fields
  const [titleEn, setTitleEn] = useState('')
  const [titleEs, setTitleEs] = useState('')
  const [titleSw, setTitleSw] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descEs, setDescEs] = useState('')
  const [descSw, setDescSw] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const p = await fetchPackById(id)
        if (!mounted || !p) return
        setTitle(p.title)
        setSlug(p.slug)
        setIsFree(p.is_free)
        setTags((p.tags ?? []).join(', '))
        const ti = (p as any).title_i18n || {}
        const di = (p as any).description_i18n || {}
        setTitleEn(ti.en ?? '')
        setTitleEs(ti.es ?? '')
        setTitleSw(ti.sw ?? '')
        setDescEn(di.en ?? '')
        setDescEs(di.es ?? '')
        setDescSw(di.sw ?? '')
      } catch (e: any) {
        setError(e?.message ?? t('admin.packs.form.errors.updateFailed'))
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, t])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updatePack(id, {
        file: file ?? undefined,
        title,
        slug,
        is_free: isFree,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        title_i18n: buildI18n({ en: titleEn, es: titleEs, sw: titleSw }),
        description_i18n: buildI18n({ en: descEn, es: descEs, sw: descSw }),
      })
      router.push('/admin/packs')
    } catch (err: any) {
      setError(err?.message ?? t('admin.packs.form.errors.updateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">{t('status.loading')}</div>

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">{t('admin.packs.form.editTitle')}</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">{t('admin.packs.form.fields.title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <fieldset className="border rounded p-3">
          <legend className="text-sm font-medium">Localized Titles</legend>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs mb-1">Title (English)</label>
              <input className="w-full rounded border px-3 py-2" value={titleEn} onChange={(e)=>setTitleEn(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Título (Español)</label>
              <input className="w-full rounded border px-3 py-2" value={titleEs} onChange={(e)=>setTitleEs(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Kichwa (Swahili)</label>
              <input className="w-full rounded border px-3 py-2" value={titleSw} onChange={(e)=>setTitleSw(e.target.value)} />
            </div>
          </div>
        </fieldset>
        <div>
          <label className="block text-sm font-medium mb-1">{t('admin.packs.form.fields.slug')}</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <fieldset className="border rounded p-3">
          <legend className="text-sm font-medium">Localized Descriptions</legend>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs mb-1">Description (English)</label>
              <textarea className="w-full rounded border px-3 py-2" value={descEn} onChange={(e)=>setDescEn(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Descripción (Español)</label>
              <textarea className="w-full rounded border px-3 py-2" value={descEs} onChange={(e)=>setDescEs(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Maelezo (Swahili)</label>
              <textarea className="w-full rounded border px-3 py-2" value={descSw} onChange={(e)=>setDescSw(e.target.value)} />
            </div>
          </div>
        </fieldset>
        <div>
          <label className="block text-sm font-medium mb-1">{t('admin.packs.form.fields.replaceCover')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="is_free"
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
          />
          <label htmlFor="is_free" className="text-sm">{t('admin.packs.form.fields.isFree')}</label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('admin.packs.form.fields.tags')}</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder={t('admin.packs.form.fields.tagsPlaceholder')}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t('admin.packs.form.buttons.saving') : t('admin.packs.form.buttons.save')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/packs')}
            className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            {t('admin.packs.form.buttons.cancel')}
          </button>
        </div>
      </form>

      {/* Items manager */}
      <ItemsManager packId={id} />
    </div>
  )
}

function buildI18n(map: { en?: string; es?: string; sw?: string }) {
  const obj: Record<string, string> = {}
  if (map.en) obj.en = map.en
  if (map.es) obj.es = map.es
  if (map.sw) obj.sw = map.sw
  return Object.keys(obj).length ? obj : null
}
