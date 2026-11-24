-- Lesson media bucket for authoring uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-media', 'lesson-media', true, 10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Lesson media public read" on storage.objects;
create policy "Lesson media public read"
  on storage.objects for select
  using (bucket_id = 'lesson-media');

drop policy if exists "Lesson media owner insert" on storage.objects;
create policy "Lesson media owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Lesson media owner update" on storage.objects;
create policy "Lesson media owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'lesson-media' and owner_id = auth.uid()::text)
  with check (bucket_id = 'lesson-media' and owner_id = auth.uid()::text);

drop policy if exists "Lesson media owner delete" on storage.objects;
create policy "Lesson media owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lesson-media' and owner_id = auth.uid()::text);
