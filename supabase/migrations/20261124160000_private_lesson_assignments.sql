-- 0.10 — private lesson assignment (catalog lessons use pack_items).

create table if not exists public.child_lesson_assignments (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (child_profile_id, lesson_id)
);

create index if not exists idx_child_lesson_assignments_profile
  on public.child_lesson_assignments (child_profile_id);

alter table public.child_lesson_assignments enable row level security;

drop policy if exists "Guardians manage lesson assignments" on public.child_lesson_assignments;
create policy "Guardians manage lesson assignments"
  on public.child_lesson_assignments for all to authenticated
  using (public.is_guardian_of(child_profile_id))
  with check (public.is_guardian_of(child_profile_id));

drop policy if exists "Children read own lesson assignments" on public.child_lesson_assignments;
create policy "Children read own lesson assignments"
  on public.child_lesson_assignments for select to authenticated
  using (
    exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  );
