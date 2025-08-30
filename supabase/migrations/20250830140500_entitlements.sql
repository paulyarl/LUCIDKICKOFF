-- Entitlements schema and RLS for premium template visibility
-- 1) User entitlements table
create table if not exists public.user_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- 2) Optional required entitlement per template
alter table public.templates
  add column if not exists required_entitlement text;

-- 3) Helper function to check entitlement for current user
create or replace function public.user_has_entitlement(ent text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_entitlements ue
    where ue.user_id = auth.uid()
      and ue.code = ent
  );
$$;

-- 4) RLS policies on templates
-- Anonymous: read only free templates
drop policy if exists "Anon can read free templates" on public.templates;
create policy "Anon can read free templates"
  on public.templates
  for select
  to anon
  using (is_free);

-- Authenticated: free OR admin OR has required entitlement
drop policy if exists "Auth can read templates with entitlement or free" on public.templates;
create policy "Auth can read templates with entitlement or free"
  on public.templates
  for select
  to authenticated
  using (
    is_free
    or public.is_admin()
    or (
      required_entitlement is not null
      and public.user_has_entitlement(required_entitlement)
    )
  );

-- 5) Storage read policies to align asset access with template visibility
-- Note: We avoid DROP on storage.objects due to ownership restrictions; guard creation with EXISTS checks.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Auth read template images with entitlement'
  ) then
    create policy "Auth read template images with entitlement"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'templates'
        and exists (
          select 1
          from public.templates t
          where t.image_path = storage.objects.name
            and (
              t.is_free
              or public.is_admin()
              or (
                t.required_entitlement is not null
                and public.user_has_entitlement(t.required_entitlement)
              )
            )
        )
      );
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon read free template images'
  ) then
    create policy "Anon read free template images"
      on storage.objects
      for select
      to anon
      using (
        bucket_id = 'templates'
        and exists (
          select 1
          from public.templates t
          where t.image_path = storage.objects.name
            and t.is_free = true
        )
      );
  end if;
end$$;
