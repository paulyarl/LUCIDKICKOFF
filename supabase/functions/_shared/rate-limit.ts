import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 5; // Max requests per window

export async function rateLimit(userId: string, action: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const now = Date.now();
  const windowStart = new Date(now - RATE_LIMIT_WINDOW).toISOString();

  // Get request count in current window
  const { data: requests, error: countError } = await supabase
    .from('rate_limits')
    .select('created_at')
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart);

  if (countError) {
    console.error('Error checking rate limit:', countError);
    // Fail open in case of database errors
    return { isRateLimited: false, retryAfter: 0 };
  }

  const requestCount = requests?.length || 0;
  
  if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
    // Calculate when the oldest request will fall out of the window
    const oldestRequest = new Date(requests[0].created_at).getTime();
    const retryAfter = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW - now) / 1000);
    return { isRateLimited: true, retryAfter };
  }

  // Log this request
  const { error: insertError } = await supabase
    .from('rate_limits')
    .insert([{ user_id: userId, action }]);

  if (insertError) {
    console.error('Error logging rate limit:', insertError);
  }

  return { isRateLimited: false, retryAfter: 0 };
}

// Cleanup old rate limit records
async function cleanupOldRateLimits() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
  
  await supabase
    .from('rate_limits')
    .delete()
    .lt('created_at', windowStart);
}

// Run cleanup periodically (every hour)
setInterval(cleanupOldRateLimits, 60 * 60 * 1000);
