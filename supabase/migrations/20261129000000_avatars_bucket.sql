-- Create a PUBLIC bucket for profile avatars (readable by anyone, writable per-user)
-- Safe to run multiple times

-- 1) Create public bucket 'avatars'
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 2097152) -- 2MB, matches client validation
on conflict (id) do nothing;

-- 2) Authenticated users INSERT only into their own folder (avatars/{uid}/…)
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );

-- 3) UPDATE only own files
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );

-- 4) DELETE only own files
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );

-- Reads are handled by the bucket's public flag (no select policy needed).
