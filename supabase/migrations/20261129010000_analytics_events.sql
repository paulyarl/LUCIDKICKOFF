-- Analytics event sink for the client-side queue (lib/analytics/*)
-- Batches POST to /api/analytics[/type] and are stored raw as jsonb.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  occurred_at timestamptz null,
  user_id uuid null references auth.users(id) on delete set null,
  session_id text null,
  name text not null,
  channel text null,          -- endpoint subpath: learning | performance | errors | events
  payload jsonb not null default '{}'::jsonb
);

alter table public.analytics_events enable row level security;

-- Anyone (incl. anonymous sessions) may ingest events; inserts only, no reads.
drop policy if exists "analytics_events_insert_any" on public.analytics_events;
create policy "analytics_events_insert_any"
  on public.analytics_events
  for insert
  with check (true);

-- No select/update/delete policies: clients cannot read analytics.
-- Admin reads go through the service role (bypasses RLS).

create index if not exists analytics_events_name_idx on public.analytics_events (name);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at);
