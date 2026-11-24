-- 0.8/0.9 — lesson authoring: step types, review states, visibility, RLS.

-- 0.8 step-type superset
alter table public.lesson_steps drop constraint if exists lesson_steps_type_check;
alter table public.lesson_steps add constraint lesson_steps_type_check
  check (type in (
    'slide', 'match-pairs', 'knowledge-check', 'reward',
    'stroke-path', 'area-fill', 'dot-to-dot', 'layer-order'
  ));

-- 0.9 lessons: ownership, review, visibility
alter table public.lessons add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.lessons add column if not exists status text not null default 'draft';
alter table public.lessons add column if not exists visibility text not null default 'private';
alter table public.lessons add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.lessons add column if not exists reviewed_at timestamptz;
alter table public.lessons add column if not exists published_at timestamptz;
alter table public.lessons add column if not exists skill_tag text;
alter table public.lessons add column if not exists est_minutes int;
alter table public.lessons add column if not exists locale text not null default 'en';
alter table public.lessons add column if not exists coloring_template_id uuid references public.templates(id) on delete set null;

alter table public.lessons drop constraint if exists lessons_status_check;
alter table public.lessons add constraint lessons_status_check
  check (status in ('draft', 'pending_review', 'published', 'rejected'));

alter table public.lessons drop constraint if exists lessons_visibility_check;
alter table public.lessons add constraint lessons_visibility_check
  check (visibility in ('private', 'catalog'));

create index if not exists idx_lessons_owner on public.lessons (owner_id);
create index if not exists idx_lessons_status on public.lessons (status, visibility);

-- Catalog metadata used by the frame and pack detail.
alter table public.packs add column if not exists objectives text[] not null default '{}';
alter table public.categories add column if not exists image_path text;

-- Helpers (security definer avoids recursive RLS).
create or replace function public.can_read_lesson(p_lesson text)
returns boolean language sql stable security definer set search_path = public as $$
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
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.lessons l
    where l.id = p_lesson
      and l.owner_id = auth.uid()
      and l.status in ('draft', 'pending_review')
  );
$$;

-- Publishing is admin-only, regardless of what the client sends.
create or replace function public.protect_lesson_publish()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    if new.status = 'published' and old.status is distinct from 'published' then
      raise exception 'only admins can publish lessons';
    end if;
    if new.visibility = 'catalog' and old.visibility is distinct from 'catalog' then
      raise exception 'only admins can promote lessons to catalog';
    end if;
  elsif new.status = 'published' and old.status is distinct from 'published' then
    new.reviewed_by = auth.uid();
    new.reviewed_at = now();
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists protect_lesson_publish on public.lessons;
create trigger protect_lesson_publish
  before update on public.lessons
  for each row execute function public.protect_lesson_publish();

alter table public.lessons enable row level security;
alter table public.lesson_steps enable row level security;

drop policy if exists "Readable lessons" on public.lessons;
create policy "Readable lessons" on public.lessons for select to authenticated
using (public.can_read_lesson(id));

drop policy if exists "Public catalog lessons" on public.lessons;
create policy "Public catalog lessons" on public.lessons for select to anon
using (status = 'published' and visibility = 'catalog');

drop policy if exists "Owners insert drafts" on public.lessons;
create policy "Owners insert drafts" on public.lessons for insert to authenticated
with check (owner_id = auth.uid() and status in ('draft', 'pending_review') and visibility = 'private');

drop policy if exists "Owners update drafts" on public.lessons;
create policy "Owners update drafts" on public.lessons for update to authenticated
using (owner_id = auth.uid() and status in ('draft', 'pending_review'))
with check (owner_id = auth.uid() and status in ('draft', 'pending_review'));

drop policy if exists "Owners delete drafts" on public.lessons;
create policy "Owners delete drafts" on public.lessons for delete to authenticated
using (owner_id = auth.uid() and status in ('draft', 'pending_review'));

drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Readable lesson steps" on public.lesson_steps;
create policy "Readable lesson steps" on public.lesson_steps for select to authenticated
using (public.can_read_lesson(lesson_id));

drop policy if exists "Owners write lesson steps" on public.lesson_steps;
create policy "Owners write lesson steps" on public.lesson_steps for all to authenticated
using (public.can_write_lesson(lesson_id))
with check (public.can_write_lesson(lesson_id));

drop policy if exists "Admins manage lesson steps" on public.lesson_steps;
create policy "Admins manage lesson steps" on public.lesson_steps for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public catalog lesson steps" on public.lesson_steps;
create policy "Public catalog lesson steps" on public.lesson_steps for select to anon
using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id and l.status = 'published' and l.visibility = 'catalog'
  )
);
