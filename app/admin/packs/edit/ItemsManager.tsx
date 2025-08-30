"use client"

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n/provider'
import {
  createPackItem,
  deletePackItem,
  listPackItemsAdmin,
  type PackItem,
  updatePackItem,
} from '@/lib/packs'

function buildI18n(map: { en?: string; es?: string; sw?: string }) {
  const obj: Record<string, string> = {}
  if (map.en) obj.en = map.en
  if (map.es) obj.es = map.es
  if (map.sw) obj.sw = map.sw
  return Object.keys(obj).length ? obj : null
}

export default function ItemsManager({ packId }: { packId: string }) {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<PackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New template form state
  const [refId, setRefId] = useState('')
  const [position, setPosition] = useState<number>(0)
  const [titleEn, setTitleEn] = useState('')
  const [titleEs, setTitleEs] = useState('')
  const [titleSw, setTitleSw] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descEs, setDescEs] = useState('')
  const [descSw, setDescSw] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listPackItemsAdmin(packId)
      setItems(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId])

  const onCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const metadata: any = {}
      const ti = buildI18n({ en: titleEn, es: titleEs, sw: titleSw })
      const di = buildI18n({ en: descEn, es: descEs, sw: descSw })
      if (ti) metadata.title_i18n = ti
      if (di) metadata.description_i18n = di

      await createPackItem({
        pack_id: packId,
        kind: 'template',
        ref_id: refId.trim(),
        position: Number(position) || 0,
        metadata: Object.keys(metadata).length ? metadata : null,
      })
      // reset
      setRefId('')
      setPosition(0)
      setTitleEn('')
      setTitleEs('')
      setTitleSw('')
      setDescEn('')
      setDescEs('')
      setDescSw('')
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const renderItemTitle = (it: PackItem) => {
    const ti = (it.metadata as any)?.title_i18n as Record<string, string> | undefined
    const base = it.ref_id
    if (ti && ti[locale]) return ti[locale]
    return base
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-3">{t('admin.packs.items.title')}</h2>
      {loading ? (
        <div>{t('status.loading')}</div>
      ) : (
        <>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <ul className="divide-y rounded-md border">
            {items.map((it) => (
              <li key={it.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    <span className="uppercase text-xs px-2 py-0.5 rounded bg-gray-100 border mr-2">{it.kind}</span>
                    {renderItemTitle(it)}
                  </div>
                  <div className="text-xs text-gray-500">ref: {it.ref_id} · pos: {it.position}</div>
                </div>
                <ItemActions item={it} onChanged={load} />
              </li>
            ))}
            {items.length === 0 && <li className="p-3 text-sm text-gray-500">{t('admin.packs.items.none')}</li>}
          </ul>

          <form onSubmit={onCreateTemplate} className="mt-6 space-y-4 rounded-md border p-4">
            <h3 className="font-medium">{t('admin.packs.items.addTemplate')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t('admin.packs.items.storagePath')}</label>
                <input className="w-full rounded border px-3 py-2" value={refId} onChange={(e)=>setRefId(e.target.value)} placeholder="templates/friendly-lion.png" required />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('admin.packs.items.position')}</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={position} onChange={(e)=>setPosition(Number(e.target.value))} />
              </div>
            </div>
            <fieldset className="border rounded p-3">
              <legend className="text-sm font-medium">{t('admin.packs.items.localizedTitle')}</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="rounded border px-3 py-2" placeholder="Title (EN)" value={titleEn} onChange={(e)=>setTitleEn(e.target.value)} />
                <input className="rounded border px-3 py-2" placeholder="Título (ES)" value={titleEs} onChange={(e)=>setTitleEs(e.target.value)} />
                <input className="rounded border px-3 py-2" placeholder="Kichwa (SW)" value={titleSw} onChange={(e)=>setTitleSw(e.target.value)} />
              </div>
            </fieldset>
            <fieldset className="border rounded p-3">
              <legend className="text-sm font-medium">{t('admin.packs.items.localizedDescription')}</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <textarea className="rounded border px-3 py-2" placeholder="Description (EN)" value={descEn} onChange={(e)=>setDescEn(e.target.value)} />
                <textarea className="rounded border px-3 py-2" placeholder="Descripción (ES)" value={descEs} onChange={(e)=>setDescEs(e.target.value)} />
                <textarea className="rounded border px-3 py-2" placeholder="Maelezo (SW)" value={descSw} onChange={(e)=>setDescSw(e.target.value)} />
              </div>
            </fieldset>
            <div>
              <button type="submit" disabled={submitting} className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? t('admin.packs.form.buttons.saving') : t('admin.packs.items.addTemplate')}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

function ItemActions({ item, onChanged }: { item: PackItem; onChanged: () => void }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refId, setRefId] = useState(item.ref_id)
  const [position, setPosition] = useState<number>(item.position)
  const [titleEn, setTitleEn] = useState<string>(((item.metadata as any)?.title_i18n?.en) ?? '')
  const [titleEs, setTitleEs] = useState<string>(((item.metadata as any)?.title_i18n?.es) ?? '')
  const [titleSw, setTitleSw] = useState<string>(((item.metadata as any)?.title_i18n?.sw) ?? '')
  const [descEn, setDescEn] = useState<string>(((item.metadata as any)?.description_i18n?.en) ?? '')
  const [descEs, setDescEs] = useState<string>(((item.metadata as any)?.description_i18n?.es) ?? '')
  const [descSw, setDescSw] = useState<string>(((item.metadata as any)?.description_i18n?.sw) ?? '')

  const onSave = async () => {
    setSaving(true)
    try {
      const metadata: any = {}
      const ti = buildI18n({ en: titleEn, es: titleEs, sw: titleSw })
      const di = buildI18n({ en: descEn, es: descEs, sw: descSw })
      if (ti) metadata.title_i18n = ti
      if (di) metadata.description_i18n = di

      await updatePackItem(item.id, {
        ref_id: refId.trim(),
        position: Number(position) || 0,
        metadata: Object.keys(metadata).length ? metadata : null,
      })
      setEditing(false)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!confirm('Delete this item?')) return
    await deletePackItem(item.id)
    onChanged()
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm rounded border" onClick={() => setEditing(true)}>{t('admin.packs.edit')}</button>
        <button className="px-3 py-1.5 text-sm rounded border text-red-600" onClick={onDelete}>{t('admin.packs.delete')}</button>
      </div>
    )
  }

  return (
    <div className="w-full md:w-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="rounded border px-2 py-1" value={refId} onChange={(e)=>setRefId(e.target.value)} />
        <input type="number" className="rounded border px-2 py-1" value={position} onChange={(e)=>setPosition(Number(e.target.value))} />
      </div>
      {item.kind === 'template' && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="rounded border px-2 py-1" placeholder="Title (EN)" value={titleEn} onChange={(e)=>setTitleEn(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="Título (ES)" value={titleEs} onChange={(e)=>setTitleEs(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="Kichwa (SW)" value={titleSw} onChange={(e)=>setTitleSw(e.target.value)} />
          <textarea className="rounded border px-2 py-1 md:col-span-3" placeholder="Description (EN)" value={descEn} onChange={(e)=>setDescEn(e.target.value)} />
          <textarea className="rounded border px-2 py-1 md:col-span-3" placeholder="Descripción (ES)" value={descEs} onChange={(e)=>setDescEs(e.target.value)} />
          <textarea className="rounded border px-2 py-1 md:col-span-3" placeholder="Maelezo (SW)" value={descSw} onChange={(e)=>setDescSw(e.target.value)} />
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <button className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50" onClick={onSave} disabled={saving}>{t('admin.packs.form.buttons.save')}</button>
        <button className="px-3 py-1.5 text-sm rounded border" onClick={() => setEditing(false)}>{t('admin.packs.form.buttons.cancel')}</button>
      </div>
    </div>
  )
}
