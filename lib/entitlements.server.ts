"use server"

import { createClient } from '@/lib/supabase/server'

export async function upsertEntitlement(formData: FormData) {
  const supabase = createClient()
  const code = (formData.get('code') as string || '').trim()
  const label = (formData.get('label') as string || '').trim()
  const description = (formData.get('description') as string || '').trim()
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10) || 0
  const active = (formData.get('active') as string) === 'on' || formData.get('active') === 'true'

  if (!code) throw new Error('Code is required')
  if (!label) throw new Error('Label is required')

  const { error } = await supabase.from('entitlements_catalog').upsert({
    code,
    label,
    description: description || null,
    sort_order,
    active,
  })
  if (error) throw new Error(error.message)
}

export async function deleteEntitlement(formData: FormData) {
  const supabase = createClient()
  const code = (formData.get('code') as string || '').trim()
  if (!code) throw new Error('Code is required')
  const { error } = await supabase.from('entitlements_catalog').delete().eq('code', code)
  if (error) throw new Error(error.message)
}
