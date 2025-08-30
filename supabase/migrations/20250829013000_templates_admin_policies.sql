-- Templates admin write policies and storage policies

-- 1) Public templates table: allow only admins to INSERT/UPDATE/DELETE
create policy if not exists "Admins can manage templates"
  on public.templates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2) Storage policies for 'templates' bucket: allow only admins to write
-- Note: bucket was created as public for read in 20250829011800_templates_schema.sql
-- Enable RLS on storage.objects if not already enabled (Supabase enables by default)
alter table if exists storage.objects enable row level security;

-- Admins can insert objects into 'templates' bucket
create policy if not exists "Admins can upload template images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'templates' and public.is_admin()
  );

-- Admins can update objects in 'templates' bucket
create policy if not exists "Admins can update template images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'templates' and public.is_admin()
  )
  with check (
    bucket_id = 'templates' and public.is_admin()
  );

-- Admins can delete objects in 'templates' bucket
create policy if not exists "Admins can delete template images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'templates' and public.is_admin()
  );
