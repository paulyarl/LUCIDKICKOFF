-- Favorites and Ratings base tables with RLS

create extension if not exists pgcrypto;

-- Entity type enum
do $$ begin
  create type public.entity_type as enum ('pack','template','carousel');
exception when duplicate_object then null; end $$;

-- user_favorites
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

alter table public.user_favorites enable row level security;

-- Only the owner can manage their favorites
create policy if not exists user_favorites_select_own on public.user_favorites
  for select using (auth.uid() = user_id);
create policy if not exists user_favorites_insert_own on public.user_favorites
  for insert with check (auth.uid() = user_id);
create policy if not exists user_favorites_update_own on public.user_favorites
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists user_favorites_delete_own on public.user_favorites
  for delete using (auth.uid() = user_id);

create index if not exists user_favorites_entity_idx on public.user_favorites(entity_type, entity_id);
create index if not exists user_favorites_user_idx on public.user_favorites(user_id);

-- user_ratings
create table if not exists public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  rating int not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

alter table public.user_ratings enable row level security;

-- Only the owner can manage their ratings
create policy if not exists user_ratings_select_own on public.user_ratings
  for select using (auth.uid() = user_id);
create policy if not exists user_ratings_insert_own on public.user_ratings
  for insert with check (auth.uid() = user_id);
create policy if not exists user_ratings_update_own on public.user_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists user_ratings_delete_own on public.user_ratings
  for delete using (auth.uid() = user_id);

create index if not exists user_ratings_entity_idx on public.user_ratings(entity_type, entity_id);
create index if not exists user_ratings_user_idx on public.user_ratings(user_id);
