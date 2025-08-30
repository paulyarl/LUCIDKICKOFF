-- Templates schema and storage setup

-- 1) Create a PUBLIC bucket for template images (readable by anyone)
insert into storage.buckets (id, name, public)
values ('templates', 'templates', true)
on conflict (id) do nothing;

-- 2) Create templates table for catalog metadata
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null, -- path within storage bucket 'templates', e.g. 'bw/flower.png'
  is_free boolean not null default false,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- 3) Enable RLS
alter table public.templates enable row level security;

-- 4) Policies
-- Anonymous users can select only free templates
drop policy if exists "templates_select_free_for_anon" on public.templates;
create policy "templates_select_free_for_anon"
  on public.templates
  for select
  to anon
  using (is_free = true);

-- Authenticated users can select all templates
drop policy if exists "templates_select_all_for_users" on public.templates;
create policy "templates_select_all_for_users"
  on public.templates
  for select
  to authenticated
  using (true);

-- Writes restricted to service role or future admin role; not granted here for safety.
-- You can manage content through Supabase Studio or add admin-only policies later.
