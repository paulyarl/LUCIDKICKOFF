-- Create carousels table (first-class entity)
-- Includes rating aggregates to support public display and filtering

create extension if not exists pgcrypto;

create table if not exists public.carousels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_path text,
  tags text[] not null default '{}',
  is_public boolean not null default true,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Basic read access; write will be controlled by your app/admin roles as needed
alter table public.carousels enable row level security;

-- Public read policy (catalog visibility controlled via is_public)
create policy if not exists carousels_public_read on public.carousels
  for select
  using (is_public = true);

-- Optional: allow authenticated users read regardless of is_public (comment out if not desired)
-- create policy carousels_auth_read on public.carousels for select using (auth.role() = 'authenticated');

create index if not exists carousels_is_public_idx on public.carousels(is_public);
create index if not exists carousels_created_at_idx on public.carousels(created_at);
create index if not exists carousels_tags_gin on public.carousels using gin(tags);
