// Projects on the new API-key model inject SUPABASE_PUBLISHABLE_KEYS /
// SUPABASE_SECRET_KEYS as JSON dicts ({ name: key }). The legacy
// SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY vars are deprecated and now
// hold retired values — keep them only as a fallback for unmigrated projects.
function firstKey(envName: string, prefix: string): string {
  const raw = Deno.env.get(envName);
  if (!raw) return '';
  try {
    const dict = JSON.parse(raw);
    for (const value of Object.values(dict)) {
      if (typeof value === 'string' && value.startsWith(prefix)) return value;
    }
    const first = Object.values(dict)[0];
    if (typeof first === 'string') return first;
  } catch {
    // not JSON — treat as a bare key
  }
  return raw.startsWith(prefix) ? raw : '';
}

export function publishableKey(): string {
  return (
    firstKey('SUPABASE_PUBLISHABLE_KEYS', 'sb_publishable_') ||
    Deno.env.get('SUPABASE_ANON_KEY') ||
    ''
  );
}

export function secretKey(): string {
  return (
    firstKey('SUPABASE_SECRET_KEYS', 'sb_secret_') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    ''
  );
}
