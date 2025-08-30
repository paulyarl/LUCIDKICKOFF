-- Add i18n JSONB fields for packs titles and descriptions
alter table public.packs
  add column if not exists title_i18n jsonb,
  add column if not exists description_i18n jsonb;

-- Optional: basic check to ensure JSON object shape
-- (not strictly enforcing locales, just object type)
alter table public.packs
  add constraint if not exists packs_title_i18n_is_object
  check (title_i18n is null or jsonb_typeof(title_i18n) = 'object');

alter table public.packs
  add constraint if not exists packs_description_i18n_is_object
  check (description_i18n is null or jsonb_typeof(description_i18n) = 'object');
