import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isAppRole, type AppRole } from '@/lib/auth/roles'

export async function GET() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }

  const roleValue = (session.user.user_metadata as any)?.role
  const role: AppRole | null = isAppRole(roleValue) ? roleValue : null

  return NextResponse.json({
    authenticated: true,
    userId: session.user.id,
    email: session.user.email,
    role,
  })
}
