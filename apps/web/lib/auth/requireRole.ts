import { NextResponse } from 'next/server'
import { createServerClient } from '../supabase/server'
import { isAppRole, type AppRole } from '@/lib/auth/roles'

export type AuthContext = {
  userId: string
  email: string | undefined
  role: AppRole
}

/**
 * Server-side guard: ensures the current session has one of the allowed roles.
 * Usage inside a Route Handler or Server Action.
 *
 * Example (Route Handler):
 * export async function GET() {
 *   const auth = await requireRole(['admin'])
 *   // ... proceed for admin-only logic
 *   return NextResponse.json({ ok: true })
 * }
 */
export async function requireRole(allowed: AppRole[]): Promise<AuthContext> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new NextResponse('Unauthorized', { status: 401 })
  }

  const roleValue = (session.user.user_metadata as any)?.role
  if (!isAppRole(roleValue)) {
    throw new NextResponse('Forbidden', { status: 403 })
  }

  if (!allowed.includes(roleValue)) {
    throw new NextResponse('Forbidden', { status: 403 })
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    role: roleValue,
  }
}
