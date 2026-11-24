import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let childId = '';
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      childId = (body.childId || '').trim();
    } else {
      const form = await req.formData();
      childId = String(form.get('childId') || '').trim();
    }

    if (!childId) {
      return NextResponse.json({ error: 'Missing childId' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: profileData } = await service
      .from('child_profiles')
      .select('id, auth_user_id')
      .or(`id.eq.${childId},auth_user_id.eq.${childId}`)
      .maybeSingle();

    const profile = profileData as unknown as { id: string; auth_user_id: string | null } | null;
    const profileId = profile?.id ?? childId;

    const { data: guardian } = await service
      .from('child_guardians')
      .select('role')
      .eq('child_profile_id', profileId)
      .eq('guardian_id', user.id)
      .maybeSingle();

    if (!guardian) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const c = await cookies();
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 4,
    };
    c.set('impersonate_user_id', profile?.auth_user_id ?? profileId, options);
    c.set('impersonate_profile_id', profileId, options);

    return NextResponse.redirect(new URL('/child', req.url), { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
