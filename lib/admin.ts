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
      const r = (u.user_metadata as any)?.role;
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
  const { data, error } = await supabase
    .from('family_relationships')
    .select('child_id')
    .eq('parent_id', parentId);
  if (error) throw error;
  const children: BasicUser[] = [];
  for (const row of data || []) {
    const { data: u } = await supabase.auth.admin.getUserById(row.child_id);
    if (u?.user) {
      children.push({ id: u.user.id, email: u.user.email || u.user.id });
    } else {
      children.push({ id: row.child_id, email: row.child_id });
    }
  }
  return children;
}

export async function getChildParents(childId: string): Promise<BasicUser[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_relationships')
    .select('parent_id')
    .eq('child_id', childId);
  if (error) throw error;
  const parents: BasicUser[] = [];
  for (const row of (data || []) as { parent_id: string }[]) {
    const { data: u } = await supabase.auth.admin.getUserById(row.parent_id);
    if (u?.user) {
      parents.push({ id: u.user.id, email: u.user.email || u.user.id });
    } else {
      parents.push({ id: row.parent_id, email: row.parent_id });
    }
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
