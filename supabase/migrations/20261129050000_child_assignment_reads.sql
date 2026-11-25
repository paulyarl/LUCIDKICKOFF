-- Sprint 2.5 — authenticated children can read their own profile-keyed
-- pack/template assignments. The guardian policy only covers guardians;
-- child_lesson_assignments already has the equivalent child-read policy.

drop policy if exists "Children read own profile pack assignments" on public.child_pack_assignments;
create policy "Children read own profile pack assignments"
  on public.child_pack_assignments for select to authenticated
  using (
    child_profile_id is not null and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Children read own profile template assignments" on public.child_template_assignments;
create policy "Children read own profile template assignments"
  on public.child_template_assignments for select to authenticated
  using (
    child_profile_id is not null and exists (
      select 1 from public.child_profiles cp
      where cp.id = child_profile_id and cp.auth_user_id = auth.uid()
    )
  );
