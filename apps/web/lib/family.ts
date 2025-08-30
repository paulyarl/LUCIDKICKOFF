import { createClient } from '@/lib/supabase/client';

export async function generateChildOtp(): Promise<{ otp: string; expires_at: string }>{
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-otp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to generate OTP');
  }
  return await res.json();
}

export async function linkChild(otp: string): Promise<{ success: boolean; child_id?: string }>{
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/link-child`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ otp }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to link child');
  }
  return await res.json();
}

export async function listChildren(): Promise<Array<{ id: string; email: string }>>{
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1) Fetch just child IDs from family relationships
  const { data, error } = await supabase
    .from('family_relationships')
    .select('child_id')
    .eq('parent_id', user.id);
  if (error) throw error;
  const childIds: string[] = (data || []).map((r: any) => r.child_id);
  if (childIds.length === 0) return [];

  // 2) Fetch friendly display info from public.profiles (publicly selectable by everyone per RLS)
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', childIds);
  if (profErr) throw profErr;
  const byId = new Map<string, { full_name: string | null; username: string | null }>();
  (profiles || []).forEach((p: any) => byId.set(p.id, { full_name: p.full_name ?? null, username: p.username ?? null }));

  // 3) Build list preserving original order, fallback to ID if no profile
  return childIds.map((id) => {
    const prof = byId.get(id);
    const display = (prof?.full_name && prof.full_name.trim())
      ? prof.full_name!
      : (prof?.username && prof.username.trim())
        ? prof.username!
        : id;
    // Keep the return shape {id, email} to avoid breaking callers; use display in email field
    return { id, email: display };
  });
}

export async function assignPack(childId: string, packId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('child_pack_assignments')
    .insert({ child_id: childId, pack_id: packId });
  if (error) throw error;
}

export async function assignTemplate(childId: string, storageRef: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('child_template_assignments')
    .insert({ child_id: childId, storage_ref: storageRef });
  if (error) throw error;
}
