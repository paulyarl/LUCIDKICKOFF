import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const c = cookies();
  c.delete('impersonate_user_id');
  return NextResponse.redirect(new URL('/parent', req.url), { status: 303 });
}
