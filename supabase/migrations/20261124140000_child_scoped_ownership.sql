-- 0.5 — child-scoped ownership. Legacy auth-user columns stay; child_profile_id
-- becomes the attribution path. Tables are empty, so the PK reshape is safe.

-- Assignments
alter table public.child_pack_assignments
  add column if not exists child_profile_id uuid references public.child_profiles(id) on delete cascade;
alter table public.child_pack_assignments alter column child_id drop not null;
create index if not exists idx_child_pack_assignments_profile
  on public.child_pack_assignments (child_profile_id);

alter table public.child_template_assignments
  add column if not exists child_profile_id uuid references public.child_profiles(id) on delete cascade;
alter table public.child_template_assignments alter column child_id drop not null;
create index if not exists idx_child_template_assignments_profile
  on public.child_template_assignments (child_profile_id);

drop policy if exists "Guardians manage profile pack assignments" on public.child_pack_assignments;
create policy "Guardians manage profile pack assignments"
  on public.child_pack_assignments for all to authenticated
  using (child_profile_id is not null and public.is_guardian_of(child_profile_id))
  with check (child_profile_id is not null and public.is_guardian_of(child_profile_id));

drop policy if exists "Guardians manage profile template assignments" on public.child_template_assignments;
create policy "Guardians manage profile template assignments"
  on public.child_template_assignments for all to authenticated
  using (child_profile_id is not null and public.is_guardian_of(child_profile_id))
  with check (child_profile_id is not null and public.is_guardian_of(child_profile_id));

-- Lesson progress: key by (child_profile_id, lesson_id); keep legacy (user_id, lesson_id).
alter table public.user_lesson_progress drop constraint if exists user_lesson_progress_pkey;
alter table public.user_lesson_progress add column if not exists id uuid not null default gen_random_uuid();
alter table public.user_lesson_progress add primary key (id);
alter table public.user_lesson_progress
  add column if not exists child_profile_id uuid references public.child_profiles(id) on delete cascade;

create unique index if not exists user_lesson_progress_child_lesson
  on public.user_lesson_progress (child_profile_id, lesson_id)
  where child_profile_id is not null;
create unique index if not exists user_lesson_progress_user_lesson_legacy
  on public.user_lesson_progress (user_id, lesson_id)
  where child_profile_id is null;

drop policy if exists "Guardians manage child progress" on public.user_lesson_progress;
create policy "Guardians manage child progress"
  on public.user_lesson_progress for all to authenticated
  using (child_profile_id is not null and public.is_guardian_of(child_profile_id))
  with check (child_profile_id is not null and public.is_guardian_of(child_profile_id));

-- Approvals can target a profile-only child.
alter table public.approval_requests alter column child_id drop not null;
alter table public.approval_requests
  add column if not exists child_profile_id uuid references public.child_profiles(id) on delete cascade;
create index if not exists idx_approval_requests_profile
  on public.approval_requests (child_profile_id);

drop policy if exists "Guardians manage profile approvals" on public.approval_requests;
create policy "Guardians manage profile approvals"
  on public.approval_requests for all to authenticated
  using (child_profile_id is not null and public.is_guardian_of(child_profile_id))
  with check (child_profile_id is not null and public.is_guardian_of(child_profile_id));

-- Artworks: family-owned. user_id is the guardian; child_profile_id attributes it.
alter table public.artworks
  add column if not exists child_profile_id uuid references public.child_profiles(id) on delete set null;
create index if not exists idx_artworks_child_profile
  on public.artworks (child_profile_id);

drop policy if exists "Families access attributed artwork" on public.artworks;
create policy "Families access attributed artwork"
  on public.artworks for all to authenticated
  using (child_profile_id is not null and public.is_guardian_of(child_profile_id))
  with check (child_profile_id is not null and public.is_guardian_of(child_profile_id));

drop policy if exists "Children access own artwork" on public.artworks;
create policy "Children access own artwork"
  on public.artworks for all to authenticated
  using (
    child_profile_id is not null
    and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  )
  with check (
    child_profile_id is not null
    and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  );
