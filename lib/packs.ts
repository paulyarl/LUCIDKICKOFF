import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export type Pack = {
  id: string
  slug: string
  title: string
  cover_path: string | null
  is_free: boolean
  tags: string[]
  created_at: string
  // Optional i18n fields if present in DB
  title_i18n?: Record<string, string> | null
  description?: string | null
  description_i18n?: Record<string, string> | null
}

export type PackItem = {
  id: string
  pack_id: string
  kind: 'lesson' | 'tutorial' | 'template'
  ref_id: string
  position: number
  created_at: string
  metadata?: Record<string, any> | null
}

// Server-side fetch all packs (admin list)
export async function fetchAllPacks(): Promise<Pack[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('packs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Pack[]
}

// Server-side fetch by id
export async function fetchPackById(id: string): Promise<Pack | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('packs')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Pack) ?? null
}

// Server-side fetch by slug (public)
export async function fetchPackBySlug(slug: string): Promise<Pack | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('packs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as Pack) ?? null
}

// Server-side fetch items for a pack, ordered by position
export async function fetchPackItems(packId: string): Promise<PackItem[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pack_items')
    .select('*')
    .eq('pack_id', packId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as PackItem[]
}

// Client-side admin: list pack items
export async function listPackItemsAdmin(packId: string): Promise<PackItem[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('pack_items')
    .select('*')
    .eq('pack_id', packId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as PackItem[]
}

// Client-side admin: create pack item
export async function createPackItem(input: {
  pack_id: string
  kind: 'lesson' | 'tutorial' | 'template'
  ref_id: string
  position?: number
  metadata?: Record<string, any> | null
}): Promise<PackItem> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('pack_items')
    .insert({
      pack_id: input.pack_id,
      kind: input.kind,
      ref_id: input.ref_id,
      position: input.position ?? 0,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    })
    .select('*')
    .single()
  if (error) throw error
  return data as PackItem
}

// Client-side admin: update pack item
export async function updatePackItem(id: string, input: {
  ref_id?: string
  position?: number
  metadata?: Record<string, any> | null
}): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('pack_items')
    .update({
      ...(input.ref_id !== undefined ? { ref_id: input.ref_id } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

// Client-side admin: delete pack item
export async function deletePackItem(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('pack_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Client-side create pack with optional cover upload
export async function createPack(input: {
  file?: File
  title: string
  slug: string
  is_free: boolean
  tags: string[]
  title_i18n?: Record<string, string> | null
  description_i18n?: Record<string, string> | null
}): Promise<void> {
  const supabase = createBrowserClient()
  let cover_path: string | null = null
  if (input.file) {
    const fileName = `${Date.now()}-${input.file.name}`
    const { error: uploadError } = await supabase.storage
      .from('packs')
      .upload(fileName, input.file, { upsert: false })
    if (uploadError) throw uploadError
    cover_path = fileName
  }

  const { error: insertError } = await supabase
    .from('packs')
    .insert({
      title: input.title,
      slug: input.slug,
      cover_path,
      is_free: input.is_free,
      tags: input.tags,
      ...(input.title_i18n ? { title_i18n: input.title_i18n } : {}),
      ...(input.description_i18n ? { description_i18n: input.description_i18n } : {}),
    })
  if (insertError) throw insertError
}

// Client-side update pack (optionally replace cover)
export async function updatePack(id: string, input: {
  file?: File
  title: string
  slug: string
  is_free: boolean
  tags: string[]
  title_i18n?: Record<string, string> | null
  description_i18n?: Record<string, string> | null
}): Promise<void> {
  const supabase = createBrowserClient()
  let cover_path: string | undefined
  if (input.file) {
    const fileName = `${Date.now()}-${input.file.name}`
    const { error: uploadError } = await supabase.storage
      .from('packs')
      .upload(fileName, input.file, { upsert: false })
    if (uploadError) throw uploadError
    cover_path = fileName
  }

  const { error } = await supabase
    .from('packs')
    .update({
      title: input.title,
      slug: input.slug,
      is_free: input.is_free,
      tags: input.tags,
      ...(cover_path ? { cover_path } : {}),
      ...(input.title_i18n !== undefined ? { title_i18n: input.title_i18n } : {}),
      ...(input.description_i18n !== undefined ? { description_i18n: input.description_i18n } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deletePack(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('packs')
    .delete()
    .eq('id', id)
  if (error) throw error
}
