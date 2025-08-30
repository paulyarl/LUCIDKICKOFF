'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { useI18n } from '@/lib/i18n/provider'

type Limits = {
  minutesPerDay: number
}

type LimitsMap = Record<string, Limits>

const KEY = 'lc_parent_time_limits'

export default function TimeLimitsPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const urlChild = searchParams.get('childId') || undefined
  const [limits, setLimits] = useState<LimitsMap>({})
  const defaultChildren = ['1', '2'] // TODO: replace with real children list
  const childIds = useMemo(() => {
    if (urlChild) return [urlChild]
    return defaultChildren
  }, [urlChild])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setLimits(JSON.parse(raw))
    } catch {}
  }, [])

  function save() {
    localStorage.setItem(KEY, JSON.stringify(limits))
  }

  function updateLimit(childId: string, minutesPerDay: number) {
    setLimits(prev => ({ ...prev, [childId]: { minutesPerDay } }))
  }

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('parent.timeLimits.title') || 'Set Time Limits'}</h1>
      <p className="text-sm text-muted-foreground">
        {urlChild
          ? (t('parent.timeLimits.subtitleForChild', { id: urlChild }) || `Configure daily screen time limit for Child ${urlChild}`)
          : (t('parent.timeLimits.subtitleGeneral') || 'Configure daily screen time limits per child (in minutes).')}
      </p>

      <div className="space-y-6 max-w-md">
        {childIds.map((id) => (
          <div key={id} className="border rounded-lg p-4 space-y-3">
            <div className="font-semibold">{t('parent.timeLimits.childTag', { id }) || `Child ${id}`}</div>
            <div className="grid gap-2">
              <Label>{t('parent.timeLimits.minutesPerDay') || 'Minutes per Day'}</Label>
              <Input
                id={`minutes-${id}`}
                type="number"
                min={0}
                value={limits[id]?.minutesPerDay ?? 0}
                onChange={(e) => updateLimit(id, Math.max(0, Number(e.target.value || 0)))}
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button onClick={save}>{t('parent.timeLimits.save') || 'Save'}</Button>
        </div>
      </div>
    </div>
  )
}
