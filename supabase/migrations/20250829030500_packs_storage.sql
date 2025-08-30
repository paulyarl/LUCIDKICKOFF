-- Packs storage bucket and basic table select policies mirror

-- 1) Create a PUBLIC bucket for pack cover images (readable by anyone)
select
  storage.create_bucket('packs', public => true)
where not exists (
  select 1 from storage.buckets where id = 'packs'
);

-- Note: CRUD on objects should be performed by admins via the app with service role or RLS-protected endpoints.
-- If you later need signed uploads from clients, add storage policies accordingly.
