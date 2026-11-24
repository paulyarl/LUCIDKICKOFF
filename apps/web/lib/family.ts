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

export type FamilyChild = {
  id: string; // auth child id when available, else profile id
  childProfileId: string;
  email: string; // nickname, kept for caller compatibility
  avatarUrl?: string | null;
  birthdate?: string | null;
};

export async function listChildren(): Promise<FamilyChild[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: guardianRows, error } = await supabase
    .from('child_guardians')
    .select('child_profile_id, child_profiles!inner(id, nickname, avatar_url, auth_user_id, birthdate)')
    .eq('guardian_id', user.id);
  if (error) throw error;

  const mapped = (guardianRows ?? [])
    .map((row: any) => {
      const profile = Array.isArray(row.child_profiles) ? row.child_profiles[0] : row.child_profiles;
      if (!profile) return null;
      return {
        id: profile.auth_user_id ?? profile.id,
        childProfileId: profile.id,
        email: profile.nickname ?? 'Learner',
        avatarUrl: profile.avatar_url ?? null,
        birthdate: profile.birthdate ?? null,
      };
    })
    .filter(Boolean) as FamilyChild[];

  if (mapped.length > 0) return mapped;

  // Legacy fallback until every family has child_guardians rows.
  const { data, error: legacyError } = await supabase
    .from('family_relationships')
    .select('child_id')
    .eq('parent_id', user.id);
  if (legacyError) throw legacyError;

  const childIds = (data ?? []).map((r: any) => r.child_id);
  if (childIds.length === 0) return [];

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', childIds);
  if (profErr) throw profErr;

  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return childIds.map((id) => {
    const prof: any = byId.get(id);
    const display = prof?.full_name?.trim() || prof?.username?.trim() || id;
    return { id, childProfileId: id, email: display };
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
