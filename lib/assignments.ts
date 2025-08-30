import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

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
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('child_pack_assignments')
    .select('pack_id, packs(*)')
    .eq('child_id', childId)
  if (error) throw error
  return (data ?? []).map((row: any) => row.packs)
}

// Server: list assigned template storage refs for a child
export async function listAssignedTemplatesForChild(childId: string): Promise<string[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('child_template_assignments')
    .select('storage_ref')
    .eq('child_id', childId)
  if (error) throw error
  return (data ?? []).map((r: any) => r.storage_ref as string)
}

// Client (parent console): assign a pack to a child
export async function assignPackToChild(childId: string, packId: string): Promise<ChildPackAssignment> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('child_pack_assignments')
    .insert({ child_id: childId, pack_id: packId, assigned_by: undefined })
    .select('*')
    .single()
  if (error) throw error
  return data as ChildPackAssignment
}

// Client: unassign a pack from a child
export async function unassignPackFromChild(childId: string, packId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('child_pack_assignments')
    .delete()
    .match({ child_id: childId, pack_id: packId })
  if (error) throw error
}

// Client: assign a template (by storage path) to a child
export async function assignTemplateToChild(childId: string, storageRef: string): Promise<ChildTemplateAssignment> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('child_template_assignments')
    .insert({ child_id: childId, storage_ref: storageRef, assigned_by: undefined })
    .select('*')
    .single()
  if (error) throw error
  return data as ChildTemplateAssignment
}

// Client: unassign a template from a child
export async function unassignTemplateFromChild(childId: string, storageRef: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('child_template_assignments')
    .delete()
    .match({ child_id: childId, storage_ref: storageRef })
  if (error) throw error
}
