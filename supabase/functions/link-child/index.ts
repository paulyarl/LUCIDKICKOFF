import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import { rateLimit } from '../_shared/rate-limit.ts';

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + (Deno.env.get('OTP_SECRET') ?? ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parent only
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'parent') {
      return new Response(JSON.stringify({ error: 'Only parents can link children' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rate = await rateLimit(user.id, 'link_child');
    if (rate.isRateLimited) {
      return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: rate.retryAfter }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const otp: string | undefined = body?.otp;
    if (!otp) {
      return new Response(JSON.stringify({ error: 'Missing OTP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hashed = await hashOTP(otp);

    // Find a valid OTP entry
    const { data: otps, error: otpErr } = await supabase
      .from('child_link_otps')
      .select('id, child_id, used, expires_at')
      .eq('otp_hash', hashed)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (otpErr || !otps || otps.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const otpRow = otps[0];

    // Insert family relationship (parent -> child)
    const { error: relErr } = await supabase
      .from('family_relationships')
      .insert({ parent_id: user.id, child_id: otpRow.child_id });

    if (relErr && !String(relErr.message || '').includes('duplicate')) {
      return new Response(JSON.stringify({ error: 'Failed to link child' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark OTP as used
    const { error: useErr } = await supabase
      .from('child_link_otps')
      .update({ used: true })
      .eq('id', otpRow.id);

    if (useErr) {
      // Non-fatal; relationship created already
      console.warn('Failed to mark OTP used:', useErr);
    }

    return new Response(
      JSON.stringify({ success: true, child_id: otpRow.child_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('link-child error', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
