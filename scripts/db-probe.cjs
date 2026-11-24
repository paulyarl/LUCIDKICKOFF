// Diagnostic: probe the Supabase Postgres DB via the session pooler.
// Usage: set SUPABASE_DB_PASSWORD env var, then `node scripts/db-probe.cjs`
const { Client } = require('pg');

const REF = 'gehshupbmmrosylkuqsk';

async function main() {
  const client = new Client({
    host: process.env.POOLER_HOST || 'aws-1-us-east-1.pooler.supabase.com',
    port: 5432, // session pooler
    user: `postgres.${REF}`,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const { rows: v } = await client.query('select version()');
  console.log('CONNECTED:', v[0].version.split(' ').slice(0, 2).join(' '));

  // Applied migrations
  try {
    const { rows } = await client.query(
      'select version, name from supabase_migrations.schema_migrations order by version'
    );
    console.log(`\nAPPLIED MIGRATIONS (${rows.length}):`);
    rows.forEach((r) => console.log(' ', r.version, r.name || ''));
  } catch (e) {
    console.log('\nschema_migrations read failed:', e.message);
  }

  // Tables from later migrations — do they exist?
  const tables = [
    'carousels', 'user_favorites', 'user_ratings',
    'user_entitlements', 'entitlements_catalog', 'profiles',
    'templates', 'packs', 'drawings',
  ];
  const { rows: t } = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_name = any($1)
     order by table_name`,
    [tables]
  );
  console.log('\nTABLES PRESENT:', t.map((r) => r.table_name).join(', '));
  const missing = tables.filter((x) => !t.find((r) => r.table_name === x));
  if (missing.length) console.log('TABLES MISSING:', missing.join(', '));

  await client.end();
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
