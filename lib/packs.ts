import { db } from '@/lib/api/server'
import { repo } from '@/lib/api/repository'
import type { PackRow } from '@/lib/api/repository'

export type Pack = {
  id: string
  slug: string
  title: string
  cover_path: string | null
  is_free: boolean
  tags?: string[]
  owner_id?: string | null
  status?: 'draft' | 'pending_review' | 'published' | 'rejected'
  visibility?: 'private' | 'catalog'
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
  return (await db.catalog().packs({ columns: '*' })) as Pack[]
}

// Server-side fetch by id
export async function fetchPackById(id: string): Promise<Pack | null> {
  return (await db.catalog().packById(id)) as Pack | null
}

// Server-side fetch by slug (public)
export async function fetchPackBySlug(slug: string): Promise<Pack | null> {
  return (await db.catalog().packBySlug(slug)) as Pack | null
}

// Server-side fetch items for a pack, ordered by position
export async function fetchPackItems(packId: string): Promise<PackItem[]> {
  return (await db.catalog().packItems(packId)) as PackItem[]
}

// Client-side admin: list pack items
export async function listPackItemsAdmin(packId: string): Promise<PackItem[]> {
  return (await repo.catalog.packItems(packId)) as PackItem[]
}

// Client-side admin: create pack item
export async function createPackItem(input: {
  pack_id: string
  kind: 'lesson' | 'tutorial' | 'template'
  ref_id: string
  position?: number
  metadata?: Record<string, any> | null
}): Promise<PackItem> {
  return (await repo.catalog.createPackItem(input)) as PackItem
}

// Client-side admin: update pack item
export async function updatePackItem(id: string, input: {
  ref_id?: string
  position?: number
  metadata?: Record<string, any> | null
}): Promise<void> {
  await repo.catalog.updatePackItem(id, input)
}

// Client-side admin: delete pack item
export async function deletePackItem(id: string): Promise<void> {
  await repo.catalog.deletePackItem(id)
}

// Client-side create pack with optional cover upload
export async function createPack(input: {
  file?: File
  title: string
  slug: string
  is_free: boolean
  title_i18n?: Record<string, string> | null
  description_i18n?: Record<string, string> | null
}): Promise<void> {
  await repo.catalog.createPack(input)
}

// Client-side update pack (optionally replace cover)
export async function updatePack(id: string, input: {
  file?: File
  title: string
  slug: string
  is_free: boolean
  title_i18n?: Record<string, string> | null
  description_i18n?: Record<string, string> | null
}): Promise<void> {
  await repo.catalog.updatePack(id, input)
}

export async function deletePack(id: string): Promise<void> {
  await repo.catalog.deletePack(id)
}
