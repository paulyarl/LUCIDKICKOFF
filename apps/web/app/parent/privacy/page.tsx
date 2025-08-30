'use client'

import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { useI18n } from '@/lib/i18n/provider'

 type Privacy = {
  shareUsageAnalytics: boolean
  showPublicProfile: boolean
  allowLeaderboard: boolean
}

const KEY = 'lc_parent_privacy_settings'

export default function PrivacySettingsPage() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<Privacy>({
    shareUsageAnalytics: false,
    showPublicProfile: false,
    allowLeaderboard: false,
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setSettings(JSON.parse(raw))
    } catch {}
  }, [])

  function toggle<K extends keyof Privacy>(k: K) {
    setSettings(prev => ({ ...prev, [k]: !prev[k] }))
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('parent.privacy.title') || 'Privacy Settings'}</h1>
      <p className="text-sm text-muted-foreground">{t('parent.privacy.subtitle') || 'Control data sharing and visibility preferences.'}</p>

      <div className="max-w-xl space-y-4">
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <Label>{t('parent.privacy.shareUsageAnalytics.label') || 'Share anonymous usage analytics'}</Label>
            <p className="text-xs text-muted-foreground">{t('parent.privacy.shareUsageAnalytics.desc') || 'Helps us improve product quality. No personal info.'}</p>
          </div>
          <Switch checked={settings.shareUsageAnalytics} onCheckedChange={() => toggle('shareUsageAnalytics')} />
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <Label>{t('parent.privacy.showPublicProfile.label') || 'Show public profile'}</Label>
            <p className="text-xs text-muted-foreground">{t('parent.privacy.showPublicProfile.desc') || 'Allows displaying basic profile info in community features.'}</p>
          </div>
          <Switch checked={settings.showPublicProfile} onCheckedChange={() => toggle('showPublicProfile')} />
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <Label>{t('parent.privacy.allowLeaderboard.label') || 'Allow leaderboard participation'}</Label>
            <p className="text-xs text-muted-foreground">{t('parent.privacy.allowLeaderboard.desc') || 'Opt-in to appear on leaderboards with a display name.'}</p>
          </div>
          <Switch checked={settings.allowLeaderboard} onCheckedChange={() => toggle('allowLeaderboard')} />
        </div>

        <div className="flex gap-2">
          <Button onClick={save}>{t('parent.privacy.save') || 'Save'}</Button>
        </div>
      </div>
    </div>
  )
}
