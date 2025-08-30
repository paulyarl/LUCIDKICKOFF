-- Pack purchases and premium gating for pack_items

-- 1) pack_purchases table
create table if not exists public.pack_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id uuid not null references public.packs(id) on delete cascade,
  purchased_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, pack_id)
);

alter table public.pack_purchases enable row level security;

-- Users can view their own purchases
drop policy if exists "Users can view their own pack purchases" on public.pack_purchases;
create policy "Users can view their own pack purchases"
  on public.pack_purchases for select
  using (auth.uid() = user_id);

-- Users can insert their own purchases (assumes payment provider webhook runs as the user or service role)
drop policy if exists "Users can insert their own pack purchases" on public.pack_purchases;
create policy "Users can insert their own pack purchases"
  on public.pack_purchases for insert
  with check (auth.uid() = user_id);

-- Admins can manage all purchases
drop policy if exists "Admins can manage all pack purchases" on public.pack_purchases;
create policy "Admins can manage all pack purchases"
  on public.pack_purchases for all
  using (exists (
    select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
  ))
  with check (exists (
    select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
  ));

-- 2) Replace pack_items public-read policy with gated policy
-- Drop the overly-permissive policy if present
drop policy if exists "Pack items are viewable by everyone" on public.pack_items;

-- Allow select if pack is free OR the user purchased the pack
drop policy if exists "Pack items readable if free or purchased" on public.pack_items;
create policy "Pack items readable if free or purchased"
  on public.pack_items for select
  using (exists (
    select 1
    from public.packs p
    where p.id = pack_items.pack_id
      and (
        p.is_free = true
        or exists (
          select 1 from public.pack_purchases pu
          where pu.pack_id = p.id and pu.user_id = auth.uid()
        )
      )
  ));
