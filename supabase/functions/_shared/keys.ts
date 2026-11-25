// Projects on the new API-key model inject SUPABASE_PUBLISHABLE_KEYS /
// SUPABASE_SECRET_KEYS (JSON dicts of { name: key }). The legacy
// SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY vars are deprecated and may
// hold retired values — kept only as fallback. Extraction is shape-agnostic:
// regex the key out of whatever the env contains (dict, array, or bare).
function extract(raw: string | undefined, prefix: string): string {
  if (!raw) return '';
  const m = raw.match(new RegExp(prefix.replace(/_/g, '_') + '[A-Za-z0-9_-]+'));
  return m ? m[0] : '';
}

export function publishableKey(): string {
  return (
    extract(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'), 'sb_publishable_') ||
    extract(Deno.env.get('SUPABASE_PUBLISHABLE_KEY'), 'sb_publishable_') ||
    Deno.env.get('SUPABASE_ANON_KEY') ||
    ''
  );
}

export function secretKey(): string {
  return (
    extract(Deno.env.get('SUPABASE_SECRET_KEYS'), 'sb_secret_') ||
    extract(Deno.env.get('SUPABASE_SECRET_KEY'), 'sb_secret_') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    ''
  );
}
