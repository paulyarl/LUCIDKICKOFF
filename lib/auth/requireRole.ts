import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-only guard to require a role before rendering a route.
 * Currently supports 'admin' via DB function public.is_admin().
 */
export async function requireRole(roles: Array<'admin'>) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    // Not logged in -> redirect to home (or login if you have one)
    redirect('/')
  }

  if (roles.includes('admin')) {
    // Prefer authoritative DB check
    const { data, error: rpcError } = await supabase.rpc('is_admin')
    if (rpcError || !data) {
      // Fallback to user_metadata role if RPC not available for some reason
      const role = (user.user_metadata as any)?.role
      if (role !== 'admin') {
        redirect('/')
      }
      return
    }
    if (data !== true) {
      redirect('/')
    }
  }
}
