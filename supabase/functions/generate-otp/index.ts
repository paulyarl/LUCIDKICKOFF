import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import { rateLimit } from '../_shared/rate-limit.ts';

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if user is a child account
async function isChildAccount(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
    
  return !error && data?.role === 'child';
}

// Check if user already has a valid OTP
async function hasValidOTP(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('child_link_otps')
    .select('id')
    .eq('child_id', userId)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .limit(1);
    
  return !error && data && data.length > 0;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    const rateLimitResult = await rateLimit(user.id, 'generate_otp');
    if (rateLimitResult.isRateLimited) {
      return new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: rateLimitResult.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a child account
    const isChild = await isChildAccount(supabase, user.id);
    if (!isChild) {
      return new Response(
        JSON.stringify({ error: 'Only child accounts can generate OTPs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing valid OTP
    const existingOTP = await hasValidOTP(supabase, user.id);
    if (existingOTP) {
      return new Response(
        JSON.stringify({ error: 'A valid OTP already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute TTL

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('child_link_otps')
      .insert([
        {
          child_id: user.id,
          otp_hash: await hashOTP(otp),
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real app, you might want to send the OTP via email/SMS here
    // For now, we'll return it in the response (for testing purposes only)
    
    return new Response(
      JSON.stringify({ 
        message: 'OTP generated successfully',
        otp, // Remove this in production or use only for testing
        expires_at: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating OTP:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to hash OTPs (use a proper hashing library in production)
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get('OTP_SECRET'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
