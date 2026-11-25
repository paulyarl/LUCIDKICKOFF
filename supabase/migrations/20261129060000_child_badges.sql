-- Sprint 2.10 — minimal derived badges.
-- Written by the progress route on lesson-progress events; keyed like
-- user_lesson_progress (child_profile_id for profile children, else user_id).
create table if not exists public.child_badges (
  id uuid primary key default gen_random_uuid(),
  badge_id text not null,
  pack_id uuid references public.packs (id) on delete cascade,
  child_profile_id uuid references public.child_profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  awarded_at timestamptz not null default now()
);

-- One award per badge per learner (pack_id may be null for global badges).
create unique index if not exists child_badges_profile_key
  on public.child_badges (child_profile_id, badge_id, pack_id) nulls not distinct
  where child_profile_id is not null;
create unique index if not exists child_badges_user_key
  on public.child_badges (user_id, badge_id, pack_id) nulls not distinct
  where child_profile_id is null;

alter table public.child_badges enable row level security;

-- Mirrors the user_lesson_progress policy shape.
create policy "Users manage own badges"
  on public.child_badges for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Children manage own badges"
  on public.child_badges for all to authenticated
  using (
    child_profile_id is not null
    and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_badges.child_profile_id
        and cp.auth_user_id = auth.uid()
    )
  )
  with check (
    child_profile_id is not null
    and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_badges.child_profile_id
        and cp.auth_user_id = auth.uid()
    )
  );

create policy "Guardians manage child badges"
  on public.child_badges for all to authenticated
  using (child_profile_id is not null and is_guardian_of (child_profile_id))
  with check (child_profile_id is not null and is_guardian_of (child_profile_id));
