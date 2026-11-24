-- Add metadata jsonb to pack_items to support i18n titles/descriptions and other options
alter table public.pack_items
  add column if not exists metadata jsonb;

alter table public.pack_items drop constraint if exists pack_items_metadata_is_object;
alter table public.pack_items
  add constraint pack_items_metadata_is_object
  check (metadata is null or jsonb_typeof(metadata) = 'object');
