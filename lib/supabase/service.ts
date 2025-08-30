import { createClient as createServerClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * NEVER import this in client components. For route handlers and server actions only.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    
  }
  return createServerClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
