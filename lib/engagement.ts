import { createClient } from '@/lib/supabase/client'

export type EntityType = 'pack' | 'template' | 'carousel'

export async function toggleFavorite(entityType: EntityType, entityId: string, desired?: boolean) {
  const supabase = createClient()
  const { data: me } = await supabase.auth.getUser()
  const userId = me.user?.id
  if (!userId) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle()

  const shouldFav = desired ?? !existing
  if (shouldFav && !existing) {
    const { error } = await supabase.from('user_favorites').insert({ user_id: userId, entity_type: entityType, entity_id: entityId })
    if (error) throw error
    return true
  } else if (!shouldFav && existing) {
    const { error } = await supabase.from('user_favorites').delete().eq('id', existing.id)
    if (error) throw error
    return false
  }
  return !!existing
}

export async function getMyFavorite(entityType: EntityType, entityId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: me } = await supabase.auth.getUser()
  const userId = me.user?.id
  if (!userId) return false
  const { data } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle()
  return !!data
}

export async function upsertRating(entityType: EntityType, entityId: string, rating: number) {
  if (rating < 1 || rating > 5) throw new Error('Rating must be 1..5')
  const supabase = createClient()
  const { data: me } = await supabase.auth.getUser()
  const userId = me.user?.id
  if (!userId) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('user_ratings')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('user_ratings')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('user_ratings')
      .insert({ user_id: userId, entity_type: entityType, entity_id: entityId, rating })
    if (error) throw error
  }
}

export async function getMyRating(entityType: EntityType, entityId: string): Promise<number | null> {
  const supabase = createClient()
  const { data: me } = await supabase.auth.getUser()
  const userId = me.user?.id
  if (!userId) return null
  const { data } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle()
  return data?.rating ?? null
}
