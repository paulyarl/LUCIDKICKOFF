-- Sprint 2.1/2.3 — player authorization + progress writes.
--
-- 1. can_read_lesson gains a branch for published PRIVATE lessons assigned to a
--    child via child_lesson_assignments — the child (auth_user_id) and their
--    guardians may read it. Without this, private assignment is dead schema.
-- 2. user_lesson_progress gets a policy so an authenticated child can write
--    rows keyed to their own child_profile_id. Until now only guardians could
--    ("Guardians manage child progress"), leaving auth children on the legacy
--    user_id key only.

create or replace function public.can_read_lesson(p_lesson text)
returns boolean language sql volatile security definer set search_path = public as $$
  select exists (
    select 1 from public.lessons l
    where l.id = p_lesson and (
      public.is_admin()
      or (l.status = 'published' and l.visibility = 'catalog')
      or l.owner_id = auth.uid()
      or (
        l.status = 'published' and exists (
          select 1
          from public.child_profiles cp
          join public.child_guardians g on g.child_profile_id = cp.id
          where cp.auth_user_id = auth.uid() and g.guardian_id = l.owner_id
        )
      )
      or (
        l.status = 'published' and exists (
          select 1
          from public.child_lesson_assignments a
          join public.child_profiles cp on cp.id = a.child_profile_id
          where a.lesson_id = l.id
            and (cp.auth_user_id = auth.uid() or public.is_guardian_of(cp.id))
        )
      )
    )
  );
$$;

drop policy if exists "Children manage own progress" on public.user_lesson_progress;
create policy "Children manage own progress"
  on public.user_lesson_progress for all to authenticated
  using (
    child_profile_id is not null and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  )
  with check (
    child_profile_id is not null and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  );
