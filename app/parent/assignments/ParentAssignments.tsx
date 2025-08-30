"use client"

import { useState, useEffect } from 'react'
import type { Pack } from '@/lib/packs'
import {
  assignPackToChild,
  unassignPackFromChild,
  assignTemplateToChild,
  unassignTemplateFromChild,
  listAssignedPacksForChild,
  listAssignedTemplatesForChild,
} from '@/lib/assignments'

type Child = { id: string; username: string | null }

export default function ParentAssignments({
  initialChildren,
  initialPacks,
}: {
  initialChildren: Child[]
  initialPacks: Pack[]
}) {
  const [children] = useState<Child[]>(initialChildren)
  const [packs] = useState<Pack[]>(initialPacks)
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id ?? '')

  const [assignedPackIds, setAssignedPackIds] = useState<Set<string>>(new Set())
  const [assignedTemplates, setAssignedTemplates] = useState<string[]>([])
  const [templateRefInput, setTemplateRefInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedChildId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [packRows, templateRefs] = await Promise.all([
          listAssignedPacksForChild(selectedChildId),
          listAssignedTemplatesForChild(selectedChildId),
        ])
        if (cancelled) return
        setAssignedPackIds(new Set((packRows ?? []).map((p: Pack) => p.id)))
        setAssignedTemplates(templateRefs ?? [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load assignments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedChildId])

  async function handleTogglePack(packId: string, assigned: boolean) {
    if (!selectedChildId) return
    setError(null)
    try {
      if (assigned) {
        await unassignPackFromChild(selectedChildId, packId)
        setAssignedPackIds(prev => {
          const next = new Set(prev)
          next.delete(packId)
          return next
        })
      } else {
        await assignPackToChild(selectedChildId, packId)
        setAssignedPackIds(prev => new Set(prev).add(packId))
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update assignment')
    }
  }

  async function handleAssignTemplate() {
    if (!selectedChildId || !templateRefInput.trim()) return
    setError(null)
    try {
      await assignTemplateToChild(selectedChildId, templateRefInput.trim())
      setAssignedTemplates(prev => Array.from(new Set([...prev, templateRefInput.trim()])))
      setTemplateRefInput('')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to assign template')
    }
  }

  async function handleUnassignTemplate(ref: string) {
    if (!selectedChildId) return
    setError(null)
    try {
      await unassignTemplateFromChild(selectedChildId, ref)
      setAssignedTemplates(prev => prev.filter(r => r !== ref))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to unassign template')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm">Select Child</label>
        <select
          className="rounded border px-3 py-2"
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
        >
          {children.map(c => (
            <option key={c.id} value={c.id}>{c.username ?? c.id.slice(0, 8)}</option>
          ))}
        </select>
        {loading && <span className="text-xs text-gray-500">Loading…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">Packs</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {packs.map(p => {
            const isAssigned = assignedPackIds.has(p.id)
            return (
              <li key={p.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-gray-500">slug: {p.slug}</div>
                </div>
                <button
                  className={`px-3 py-1.5 text-sm rounded ${isAssigned ? 'border text-red-600' : 'bg-blue-600 text-white'}`}
                  onClick={() => handleTogglePack(p.id, isAssigned)}
                >
                  {isAssigned ? 'Unassign' : 'Assign'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">Templates</h2>
        <div className="flex items-center gap-2 mb-3">
          <input
            className="w-full md:w-1/2 rounded border px-3 py-2"
            placeholder="templates/friendly-lion.png"
            value={templateRefInput}
            onChange={(e) => setTemplateRefInput(e.target.value)}
          />
          <button
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white"
            onClick={handleAssignTemplate}
          >
            Assign Template
          </button>
        </div>
        <ul className="space-y-2">
          {assignedTemplates.length === 0 && (
            <li className="text-sm text-gray-500">No templates assigned.</li>
          )}
          {assignedTemplates.map(ref => (
            <li key={ref} className="flex items-center justify-between rounded border p-2">
              <span className="text-sm">{ref}</span>
              <button
                className="px-3 py-1.5 text-sm rounded border text-red-600"
                onClick={() => handleUnassignTemplate(ref)}
              >
                Unassign
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
