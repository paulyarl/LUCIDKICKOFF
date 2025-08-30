-- Update policies to allow any entitlement for premium templates by default
-- Adds helper function and updates SELECT policies.

-- 1) Helper: does current user have any entitlement?
create or replace function public.user_has_any_entitlement()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_entitlements ue
    where ue.user_id = auth.uid()
  );
$$;

-- 2) Update templates SELECT policy for authenticated users
-- Drop and recreate with refined logic
drop policy if exists "Auth can read templates with entitlement or free" on public.templates;
create policy "Auth can read templates with entitlement or free"
  on public.templates
  for select
  to authenticated
  using (
    is_free
    or public.is_admin()
    or (
      -- If a specific entitlement is required, must have it
      required_entitlement is not null
      and public.user_has_entitlement(required_entitlement)
    )
    or (
      -- If no specific entitlement is required (premium generic), any entitlement grants access
      required_entitlement is null
      and not is_free
      and public.user_has_any_entitlement()
    )
  );

-- 3) Storage policies: align asset reads with the above logic
-- Use unique names to avoid DROP on storage.objects ownership constraints
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Auth read template images with entitlement v2'
  ) then
    create policy "Auth read template images with entitlement v2"
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
              or (
                t.required_entitlement is null
                and not t.is_free
                and public.user_has_any_entitlement()
              )
            )
        )
      );
  end if;
end$$;
