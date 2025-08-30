-- Allow 'template' as a pack_items.kind
-- Drop previous kind check constraint if it exists, then add a new one including 'template'
alter table public.pack_items drop constraint if exists pack_items_kind_check;
alter table public.pack_items
  add constraint pack_items_kind_check
  check (kind in ('lesson','tutorial','template'));
