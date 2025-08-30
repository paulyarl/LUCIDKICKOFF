-- Add i18n fields for packs
-- Adds optional JSONB fields to store localized titles and descriptions
-- Roll-forward safe: uses IF NOT EXISTS

alter table public.packs
  add column if not exists title_i18n jsonb,
  add column if not exists description_i18n jsonb;

-- (Optional) You can backfill English as default, uncomment if desired:
-- update public.packs set title_i18n = coalesce(title_i18n, jsonb_build_object('en', title));
