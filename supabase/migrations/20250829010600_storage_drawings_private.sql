-- Create a PRIVATE bucket for user drawings and add per-user RLS policies
-- Safe to run multiple times: uses IF NOT EXISTS where applicable

-- 1) Create private bucket 'drawings'
insert into storage.buckets (id, name, public)
values ('drawings', 'drawings', false)
on conflict (id) do nothing;

-- 3) Allow authenticated users to SELECT only their own files
create policy "drawings_read_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'drawings'
    and name like auth.uid()::text || '/%'
  );

-- 4) Allow authenticated users to INSERT only into their own folder
create policy "drawings_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'drawings'
    and name like auth.uid()::text || '/%'
  );

-- 5) Allow authenticated users to UPDATE only their own files
create policy "drawings_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'drawings'
    and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'drawings'
    and name like auth.uid()::text || '/%'
  );

-- 6) Allow authenticated users to DELETE only their own files
create policy "drawings_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'drawings'
    and name like auth.uid()::text || '/%'
  );
