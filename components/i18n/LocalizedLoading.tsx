'use client'

import { useI18n } from '@/lib/i18n/provider'

export function LocalizedLoading() {
  const { t } = useI18n()
  return <div>{t('status.loading')}</div>
}
