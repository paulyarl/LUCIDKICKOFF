-- Sprint 3.3 — sync_operations + cloud-sync consent gate (D32).
--
-- sync_operations is the server-side dedupe ledger for the client outbox:
-- each row records a client-generated op_id applied by /api/sync/batch.
-- Replays with the same op_id are reported as duplicates, never re-applied.
--
-- has_sync_consent(p_child) enforces D32: ingest only proceeds when a
-- guardian holds a non-withdrawn consent_records row with purpose
-- 'cloud_sync' covering the learner (child_profile_id NULL = family-wide).
-- Security definer so a child's own session can check guardian consent —
-- consent_records RLS restricts rows to the guardian's own uid.

create table if not exists public.sync_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  op_id text not null,
  type text not null,
  payload_version int not null default 1,
  payload jsonb not null default '{}'::jsonb,
  child_profile_id uuid references public.child_profiles(id) on delete set null,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, op_id)
);

create index if not exists sync_operations_type_idx
  on public.sync_operations (type, applied_at);

alter table public.sync_operations enable row level security;

drop policy if exists "Users read own sync operations" on public.sync_operations;
create policy "Users read own sync operations"
  on public.sync_operations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own sync operations" on public.sync_operations;
create policy "Users insert own sync operations"
  on public.sync_operations for insert to authenticated
  with check (user_id = auth.uid());

create or replace function public.has_sync_consent(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_child is null then exists (
      -- adult learner: their own family-wide cloud_sync consent
      select 1 from public.consent_records c
      where c.guardian_id = auth.uid()
        and c.purpose = 'cloud_sync'
        and c.withdrawn_at is null
        and c.child_profile_id is null
    )
    else exists (
      -- child learner: a guardian's consent, family-wide or child-scoped
      select 1
      from public.child_guardians g
      join public.consent_records c on c.guardian_id = g.guardian_id
      where g.child_profile_id = p_child
        and c.purpose = 'cloud_sync'
        and c.withdrawn_at is null
        and (c.child_profile_id is null or c.child_profile_id = p_child)
    )
  end;
$$;
