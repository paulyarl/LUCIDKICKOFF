import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/api/server';
import { signImpersonation, IMPERSONATION_COOKIE, IMPERSONATION_COOKIE_OPTIONS } from '@/lib/auth/impersonation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await db.auth().user();
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

    const profile = await db.service().family.childContext({ anyId: childId });
    const profileId = profile?.id ?? childId;

    const guardianChildren = await db.service().family.childrenForGuardian(user.id);
    const isGuardian = guardianChildren.some((c) => c.childProfileId === profileId);

    if (!isGuardian) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const c = await cookies();
    const token = signImpersonation({
      userId: profile?.auth_user_id ?? profileId,
      profileId,
      guardianId: user.id,
    });
    c.set(IMPERSONATION_COOKIE, token, IMPERSONATION_COOKIE_OPTIONS);

    return NextResponse.redirect(new URL('/child', req.url), { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
