import { createServiceClient } from '@/lib/supabase/service';

export type BasicUser = { id: string; email: string };

export async function listUsersByRole(role: 'parent' | 'child'): Promise<BasicUser[]> {
  const supabase = createServiceClient();
  const result: BasicUser[] = [];
  let page = 1;
  const perPage = 100;
  // Paginate through auth users and filter by user_metadata.role
  // Supabase Admin API v2
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    for (const u of users) {
      const r = (u.app_metadata as any)?.role ?? (u.user_metadata as any)?.role;
      if (r === role) {
        result.push({ id: u.id, email: u.email || u.id });
      }
    }
    if (!data || users.length < perPage) break;
    page += 1;
  }
  return result;
}

export async function getParentChildren(parentId: string): Promise<BasicUser[]> {
  const supabase = createServiceClient();

  const { data: guardianRows } = await supabase
    .from('child_guardians')
    .select('child_profile_id, child_profiles!inner(id, nickname, auth_user_id)')
    .eq('guardian_id', parentId);

  const mapped = (guardianRows ?? [])
    .map((row: any) => {
      const profile = Array.isArray(row.child_profiles) ? row.child_profiles[0] : row.child_profiles;
      if (!profile) return null;
      return { id: profile.auth_user_id ?? profile.id, email: profile.nickname ?? profile.id };
    })
    .filter(Boolean) as BasicUser[];

  if (mapped.length > 0) return mapped;

  const { data, error } = await supabase
    .from('family_relationships')
    .select('child_id')
    .eq('parent_id', parentId);
  if (error) throw error;

  const children: BasicUser[] = [];
  for (const row of data || []) {
    const { data: u } = await supabase.auth.admin.getUserById(row.child_id);
    children.push({ id: row.child_id, email: u?.user?.email || row.child_id });
  }
  return children;
}

export async function getChildParents(childId: string): Promise<BasicUser[]> {
  const supabase = createServiceClient();

  const { data: profileData } = await supabase
    .from('child_profiles')
    .select('id')
    .or(`id.eq.${childId},auth_user_id.eq.${childId}`)
    .maybeSingle();
  const profile = profileData as unknown as { id: string } | null;

  if (profile) {
    const { data: guardianRows } = await supabase
      .from('child_guardians')
      .select('guardian_id')
      .eq('child_profile_id', profile.id);
    const parents: BasicUser[] = [];
    for (const row of (guardianRows ?? []) as { guardian_id: string }[]) {
      const { data: u } = await supabase.auth.admin.getUserById(row.guardian_id);
      parents.push({ id: row.guardian_id, email: u?.user?.email || row.guardian_id });
    }
    if (parents.length > 0) return parents;
  }

  const { data, error } = await supabase
    .from('family_relationships')
    .select('parent_id')
    .eq('child_id', childId);
  if (error) throw error;

  const parents: BasicUser[] = [];
  for (const row of (data || []) as { parent_id: string }[]) {
    const { data: u } = await supabase.auth.admin.getUserById(row.parent_id);
    parents.push({ id: row.parent_id, email: u?.user?.email || row.parent_id });
  }
  return parents;
}

export async function linkParentChild(parentId: string, childId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('family_relationships')
    .insert({ parent_id: parentId, child_id: childId });
  if (error && !String(error.message).toLowerCase().includes('duplicate')) throw error;
}

export async function unlinkParentChild(parentId: string, childId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('family_relationships')
    .delete()
    .eq('parent_id', parentId)
    .eq('child_id', childId);
  if (error) throw error;
}

export async function findUserByEmail(email: string): Promise<BasicUser | null> {
  const supabase = createServiceClient();
  // Admin listUsers doesn't have direct filter by email; we can paginate or use auth.admin.getUserById if we had id.
  // We'll paginate and find first match.
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (match) return { id: match.id, email: match.email || match.id };
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}
