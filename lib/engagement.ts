// S4.1 — engagement (favorites/ratings) moved behind the lib/api repository.
import { repo } from '@/lib/api/repository'

export type EntityType = 'pack' | 'template' | 'carousel'

export async function toggleFavorite(entityType: EntityType, entityId: string, desired?: boolean) {
  const favs = await repo.library.favorites(entityType)
  const existing = favs.some((f) => f.entity_id === entityId)
  const shouldFav = desired ?? !existing
  if (shouldFav !== existing) {
    await repo.library.toggleFavorite(entityType, entityId, shouldFav)
  }
  return shouldFav
}

export async function getMyFavorite(entityType: EntityType, entityId: string): Promise<boolean> {
  const favs = await repo.library.favorites(entityType)
  return favs.some((f) => f.entity_id === entityId)
}

export async function upsertRating(entityType: EntityType, entityId: string, rating: number) {
  await repo.library.setRating(entityType, entityId, rating)
}

export async function getMyRating(entityType: EntityType, entityId: string): Promise<number | null> {
  return repo.library.myRating(entityType, entityId)
}
