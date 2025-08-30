import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

// Server-side Supabase client using cookie-based auth.
// Uses the public URL + anon key; auth state is carried via cookies.
export function createServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies()

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // next/headers cookies are mutable in Route Handlers and Server Actions
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
