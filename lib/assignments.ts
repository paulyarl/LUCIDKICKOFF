import { db } from '@/lib/api/server'
import { repo } from '@/lib/api/repository'

export type ChildPackAssignment = {
  id: string
  child_id: string
  pack_id: string
  assigned_by: string | null
  created_at: string
}

export type ChildTemplateAssignment = {
  id: string
  child_id: string
  storage_ref: string
  assigned_by: string | null
  created_at: string
}

// Server: list assigned packs for a child (joins packs)
export async function listAssignedPacksForChild(childId: string) {
  return db.catalog().assignedPacksForChild(childId)
}

// Server: list assigned template storage refs for a child
export async function listAssignedTemplatesForChild(childId: string): Promise<string[]> {
  return db.catalog().assignedTemplatesForChild(childId)
}

// Client (parent console): assign a pack to a child
export async function assignPackToChild(childId: string, packId: string): Promise<ChildPackAssignment> {
  return (await repo.family.assignPack(childId, packId)) as ChildPackAssignment
}

// Client: unassign a pack from a child
export async function unassignPackFromChild(childId: string, packId: string): Promise<void> {
  await repo.family.unassignPack(childId, packId)
}

// Client: assign a template (by storage path) to a child
export async function assignTemplateToChild(childId: string, storageRef: string): Promise<ChildTemplateAssignment> {
  return (await repo.family.assignTemplate(childId, storageRef)) as ChildTemplateAssignment
}

// Client: unassign a template from a child
export async function unassignTemplateFromChild(childId: string, storageRef: string): Promise<void> {
  await repo.family.unassignTemplate(childId, storageRef)
}
