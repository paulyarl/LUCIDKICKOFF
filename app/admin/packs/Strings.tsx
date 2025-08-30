"use client"

import React from 'react'
import { useI18n } from '@/lib/i18n/provider'

export function Txt({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  const { t } = useI18n()
  return <>{t(k, vars)}</>
}

export function FreePremium({ isFree }: { isFree: boolean }) {
  const { t } = useI18n()
  return <>{isFree ? t('admin.packs.free') : t('admin.packs.premium')}</>
}
