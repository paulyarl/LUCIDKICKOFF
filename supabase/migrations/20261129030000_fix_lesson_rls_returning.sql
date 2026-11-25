-- Repair: INSERT/UPDATE ... RETURNING (what the API's .select() does) evaluates
-- the SELECT using-policy on the new row inside the same statement. STABLE
-- functions can't see the statement's own writes, so can_read_lesson()/
-- can_write_lesson() returned false on brand-new drafts and PostgREST reported
-- "new row violates row-level security policy". Marking them VOLATILE makes
-- them see the statement's writes.

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
    )
  );
$$;

create or replace function public.can_write_lesson(p_lesson text)
returns boolean language sql volatile security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.lessons l
    where l.id = p_lesson
      and l.owner_id = auth.uid()
      and l.status in ('draft', 'pending_review')
  );
$$;

-- Belt and suspenders: owner check directly on the row (no snapshot dependency)
drop policy if exists "Readable lessons" on public.lessons;
create policy "Readable lessons" on public.lessons for select to authenticated
using (owner_id = auth.uid() or public.can_read_lesson(id));
