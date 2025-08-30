/*
  Seed demo users in Supabase Auth using the Service Role key.
  WARNING: Service role must NEVER be exposed to the client. Run locally or in secure CI only.

  Required env vars:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY

  Demo account env vars (server-side only; do NOT prefix with NEXT_PUBLIC):
  - DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD
  - DEMO_PARENT_EMAIL, DEMO_PARENT_PASSWORD
  - DEMO_CHILD_EMAIL, DEMO_CHILD_PASSWORD

  Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD=... \
  DEMO_PARENT_EMAIL=... DEMO_PARENT_PASSWORD=... \
  DEMO_CHILD_EMAIL=... DEMO_CHILD_PASSWORD=... \
  node scripts/seed-demo-users.js
*/

 require('dotenv').config({ path: '.env.local' });

  const SEED_ROLES = (process.env.SEED_ROLES || 'admin,parent,child')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const requiredBase = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const roleEnvMap = {
    admin: ['DEMO_ADMIN_EMAIL', 'DEMO_ADMIN_PASSWORD'],
    parent: ['DEMO_PARENT_EMAIL', 'DEMO_PARENT_PASSWORD'],
    child: ['DEMO_CHILD_EMAIL', 'DEMO_CHILD_PASSWORD'],
  };

  const required = [
    ...requiredBase,
    ...SEED_ROLES.flatMap(role => roleEnvMap[role] || []),
  ];

  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required env var: ${key}`);
      console.error(`Hint: set SEED_ROLES to a subset (e.g. SEED_ROLES=admin) or provide the missing variables.`)
      process.exit(1);
    }
  }

 const SUPABASE_URL = process.env.SUPABASE_URL;
 const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createUser(email, password, role) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      user_metadata: { role },
      email_confirm: true,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`✓ Created/exists: ${email} (role=${role})`, data.id ? `id=${data.id}` : '');
  } else {
    const text = await res.text();
    // If user exists, log and continue
    if (text.toLowerCase().includes('already registered')) {
      console.log(`• Already exists: ${email} (role=${role})`);
      return;
    }
    console.error(`✗ Failed to create ${email} (role=${role}) -> ${res.status}: ${text}`);
  }
}

(async () => {
  try {
    if (SEED_ROLES.includes('admin')) {
      await createUser(process.env.DEMO_ADMIN_EMAIL, process.env.DEMO_ADMIN_PASSWORD, 'admin');
    }
    if (SEED_ROLES.includes('parent')) {
      await createUser(process.env.DEMO_PARENT_EMAIL, process.env.DEMO_PARENT_PASSWORD, 'parent');
    }
    if (SEED_ROLES.includes('child')) {
      await createUser(process.env.DEMO_CHILD_EMAIL, process.env.DEMO_CHILD_PASSWORD, 'child');
    }
    console.log('Done.');
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
