import { createClient } from '@/lib/supabase/server'
import { fetchAllPacks, type Pack } from '@/lib/packs'
import ParentAssignments from './ParentAssignments'

export const revalidate = 0

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Simple guard; in a real app you might redirect to sign-in
    return <div className="p-6">Please sign in to manage assignments.</div>
  }

  // Find children for this parent via family_relationships
  const { data: childrenRows, error: childrenError } = await supabase
    .from('family_relationships')
    .select('child_id, profiles:child_id(id, username)')
    .eq('parent_id', user.id)

  if (childrenError) {
    return <div className="p-6 text-red-600">Failed to load children.</div>
  }

  const children = (childrenRows ?? []).map((r: any) => ({
    id: r.profiles?.id ?? r.child_id,
    username: r.profiles?.username ?? 'Child',
  })) as Array<{ id: string; username: string | null }>

  let packs: Pack[] = []
  try {
    packs = await fetchAllPacks()
  } catch (e) {
    // ignore; UI will handle empty
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Parent Console – Assignments</h1>
      <ParentAssignments initialChildren={children} initialPacks={packs} />
    </div>
  )
}
