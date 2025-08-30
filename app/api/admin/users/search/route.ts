import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await requireRole(['admin']);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const role = (searchParams.get('role') || '').toLowerCase().trim(); // optional: parent | child
  const perPage = Math.min(Number(searchParams.get('limit') || 50), 200);

  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data?.users || [])
    .filter((u) => {
      const email = (u.email || '').toLowerCase();
      const name = ((u.user_metadata as any)?.full_name || '').toLowerCase();
      const metaRole = ((u.user_metadata as any)?.role || '').toLowerCase();
      const matchesQuery = q ? email.includes(q) || name.includes(q) : true;
      const matchesRole = role ? metaRole === role : true;
      return matchesQuery && matchesRole;
    })
    .slice(0, perPage)
    .map((u) => ({
      id: u.id,
      email: u.email,
      full_name: (u.user_metadata as any)?.full_name || null,
      role: (u.user_metadata as any)?.role || null,
    }));

  return NextResponse.json({ users });
}
