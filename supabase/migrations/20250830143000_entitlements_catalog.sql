-- Entitlements catalog managed by admins; used for dropdown when creating templates
create table if not exists public.entitlements_catalog (
  code text primary key,
  label text not null,
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.entitlements_catalog enable row level security;

-- Policies
drop policy if exists "Entitlements anon none" on public.entitlements_catalog;
create policy "Entitlements anon none"
  on public.entitlements_catalog
  for select
  to anon
  using (false);

drop policy if exists "Entitlements auth read active" on public.entitlements_catalog;
create policy "Entitlements auth read active"
  on public.entitlements_catalog
  for select
  to authenticated
  using (active = true or public.is_admin());

drop policy if exists "Entitlements admin write" on public.entitlements_catalog;
create policy "Entitlements admin write"
  on public.entitlements_catalog
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed first example if not present
insert into public.entitlements_catalog (code, label, description, sort_order)
values ('gold', 'Gold', 'Gold plan entitlement', 10)
on conflict (code) do nothing;
