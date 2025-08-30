-- Add child assignments for packs and templates
-- Generated at 2025-08-29 04:00 local time

create extension if not exists "uuid-ossp";

-- Child Pack Assignments
create table if not exists public.child_pack_assignments (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references auth.users(id) on delete cascade not null,
  pack_id uuid references public.packs(id) on delete cascade not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(child_id, pack_id)
);

-- Child Template Assignments (by storage ref path)
create table if not exists public.child_template_assignments (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references auth.users(id) on delete cascade not null,
  storage_ref text not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(child_id, storage_ref)
);

-- Indexes
create index if not exists idx_child_pack_assignments_child on public.child_pack_assignments(child_id);
create index if not exists idx_child_pack_assignments_pack on public.child_pack_assignments(pack_id);
create index if not exists idx_child_template_assignments_child on public.child_template_assignments(child_id);
create index if not exists idx_child_template_assignments_storage on public.child_template_assignments(storage_ref);

-- Enable RLS
alter table public.child_pack_assignments enable row level security;
alter table public.child_template_assignments enable row level security;

-- Policies for child_pack_assignments
-- Parents can view assignments for their children
drop policy if exists "Parents view child pack assignments" on public.child_pack_assignments;
create policy "Parents view child pack assignments"
  on public.child_pack_assignments for select
  using (
    exists (
      select 1 from public.family_relationships fr
      where fr.parent_id = auth.uid() and fr.child_id = child_id
    )
    or auth.uid() = child_id -- child can view own assignments
  );

-- Parents can assign packs to their children
drop policy if exists "Parents assign pack to child" on public.child_pack_assignments;
create policy "Parents assign pack to child"
  on public.child_pack_assignments for insert
  with check (
    exists (
      select 1 from public.family_relationships fr
      where fr.parent_id = auth.uid() and fr.child_id = child_id
    )
  );

-- Parents can remove assignments for their children
drop policy if exists "Parents delete child pack assignment" on public.child_pack_assignments;
create policy "Parents delete child pack assignment"
  on public.child_pack_assignments for delete
  using (
    exists (
      select 1 from public.family_relationships fr
      where fr.parent_id = auth.uid() and fr.child_id = child_id
    )
  );

-- Child can read their own assignments
drop policy if exists "Child reads own pack assignments" on public.child_pack_assignments;
create policy "Child reads own pack assignments"
  on public.child_pack_assignments for select
  using (auth.uid() = child_id);

-- Policies for child_template_assignments
drop policy if exists "Parents view child template assignments" on public.child_template_assignments;
create policy "Parents view child template assignments"
  on public.child_template_assignments for select
  using (
    exists (
      select 1 from public.family_relationships fr
      where fr.parent_id = auth.uid() and fr.child_id = child_id
    )
    or auth.uid() = child_id
  );

drop policy if exists "Parents assign template to child" on public.child_template_assignments;
create policy "Parents assign template to child"
  on public.child_template_assignments for insert
  with check (
    exists (
      select 1 from public.family_relationships fr
      where fr.parent_id = auth.uid() and fr.child_id = child_id
    )
  );

drop policy if exists "Parents delete child template assignment" on public.child_template_assignments;
create policy "Parents delete child template assignment"
  on public.child_template_assignments for delete
  using (
    exists (
      select 1 from public.family_relationships fr
      where fr.parent_id = auth.uid() and fr.child_id = child_id
    )
  );

drop policy if exists "Child reads own template assignments" on public.child_template_assignments;
create policy "Child reads own template assignments"
  on public.child_template_assignments for select
  using (auth.uid() = child_id);
