'use client'

import { useI18n } from '@/lib/i18n/provider'

export function AppTitle() {
  const { t } = useI18n()
  return <h1>{t('app.title')}</h1>
}

export function MainNavLabel() {
  const { t } = useI18n()
  return <span className="sr-only">{t('nav.main')}</span>
}
