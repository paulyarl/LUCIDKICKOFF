import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support both form submissions and JSON payloads
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

    // Verify relationship: user must be the parent of childId
    const { data, error } = await supabase
      .from('family_relationships')
      .select('parent_id')
      .eq('parent_id', user.id)
      .eq('child_id', childId)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Set impersonation cookie for 4 hours
    const c = await cookies();
    c.set('impersonate_user_id', childId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4,
    });

    // Redirect to child dashboard
    return NextResponse.redirect(new URL('/child', req.url), { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
