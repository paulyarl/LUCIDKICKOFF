import { redirect } from 'next/navigation'
import { createServerClient } from '../supabase/server'
import { isAppRole, type AppRole } from '@/lib/auth/roles'

export type AuthContext = {
  userId: string
  email: string | undefined
  role: AppRole
}

/**
 * Server Component guard: ensures the current session has one of the allowed roles.
 * Unauthorized users are redirected rather than thrown at, which avoids a 500
 * from a server component. Route Handlers should check the session explicitly
 * and return 401/403 JSON instead.
 */
export async function requireRole(allowed: AppRole[]): Promise<AuthContext> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/auth/login')
  }

  const roleValue = (session.user.app_metadata as any)?.role
  if (!isAppRole(roleValue) || !allowed.includes(roleValue)) {
    redirect('/')
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    role: roleValue,
  }
}
