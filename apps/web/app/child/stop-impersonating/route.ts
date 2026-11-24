import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IMPERSONATION_COOKIE } from '@/lib/auth/impersonation';

export async function POST(req: Request) {
  const c = cookies();
  c.delete(IMPERSONATION_COOKIE);
  c.delete('impersonate_user_id');
  c.delete('impersonate_profile_id');
  return NextResponse.redirect(new URL('/parent', req.url), { status: 303 });
}
