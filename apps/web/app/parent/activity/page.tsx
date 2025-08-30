'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useI18n } from '@/lib/i18n/provider'

type ActivityItem = {
  id: string
  childId: string
  type: 'canvas' | 'lesson' | 'study' | 'pack'
  description: string
  at: string // ISO date
}

const CHILDREN = ['1', '2'] // TODO: replace with real children list
const KEY_PREFIX = 'lc_activity_log_' // per child: lc_activity_log_<childId>

export default function ActivityPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const initialFromUrl = searchParams.get('childId') || undefined
  const [childId, setChildId] = useState<string>(initialFromUrl || CHILDREN[0])
  const [q, setQ] = useState('')
  const [items, setItems] = useState<ActivityItem[]>([])
  const childOptions = useMemo(() => {
    // Include the URL-provided childId if it's not in the default list
    const list = new Set(CHILDREN)
    if (initialFromUrl) list.add(initialFromUrl)
    return Array.from(list)
  }, [initialFromUrl])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${KEY_PREFIX}${childId}`)
      const list: ActivityItem[] = raw ? JSON.parse(raw) : []
      setItems(Array.isArray(list) ? list : [])
    } catch {
      setItems([])
    }
  }, [childId])

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase()
    return items
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .filter(i => !norm || i.description.toLowerCase().includes(norm))
  }, [items, q])

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('parent.activity.title') || 'View Activity'}</h1>
      <p className="text-sm text-muted-foreground">{t('parent.activity.subtitle') || 'Browse recent activity by child.'}</p>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="min-w-[200px]">
          <Label>{t('parent.activity.child.label') || 'Child'}</Label>
          <Select value={childId} onValueChange={setChildId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('parent.activity.child.placeholder') || 'Child'} /></SelectTrigger>
            <SelectContent>
              {childOptions.map(id => (
                <SelectItem key={id} value={id}>{t('parent.activity.child.option', { id }) || `Child ${id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grow max-w-sm">
          <Label>{t('common.search') || 'Search'}</Label>
          <Input id="search" placeholder={t('parent.activity.search.placeholder') || 'Type to filter activity'} value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="border rounded-lg divide-y">
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">{t('parent.activity.empty') || 'No activity yet.'}</div>
        )}
        {filtered.map(item => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{item.description}</div>
              <div className="text-xs text-muted-foreground">{new Date(item.at).toLocaleString()} • {item.type}</div>
            </div>
            <div className="text-xs text-muted-foreground">{t('parent.activity.child.tag', { id: item.childId }) || `Child ${item.childId}`}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        {t('parent.activity.tip.prefix') || 'Tip:'} {t('parent.activity.tip.text', { key: `${KEY_PREFIX}<childId>` }) || `Developers can inject mock items with localStorage key "${KEY_PREFIX}<childId>".`}
      </div>
    </div>
  )
}
