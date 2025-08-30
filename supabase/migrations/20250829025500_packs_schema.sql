-- Packs schema and RLS
create table if not exists public.packs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  cover_path text,
  is_free boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.pack_items (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid not null references public.packs(id) on delete cascade,
  kind text not null check (kind in ('lesson','tutorial')),
  ref_id text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.packs enable row level security;
alter table public.pack_items enable row level security;

-- Policies: public read, admin manage
-- Uses public.is_admin() defined in 20240827180000_add_rls_and_security.sql

-- packs
drop policy if exists "Packs are viewable by everyone" on public.packs;
create policy "Packs are viewable by everyone"
  on public.packs for select using (true);

drop policy if exists "Only admins can manage packs" on public.packs;
create policy "Only admins can manage packs"
  on public.packs for all
  using (public.is_admin())
  with check (public.is_admin());

-- pack_items
drop policy if exists "Pack items are viewable by everyone" on public.pack_items;
create policy "Pack items are viewable by everyone"
  on public.pack_items for select using (true);

drop policy if exists "Only admins can manage pack items" on public.pack_items;
create policy "Only admins can manage pack items"
  on public.pack_items for all
  using (public.is_admin())
  with check (public.is_admin());
