-- Deprecate legacy freeform taxonomy columns.
-- Discovery now lives in public.categories + public.content_categories
-- (see 20261127000000_discovery_taxonomy.sql). All code paths stopped
-- reading/writing these columns in Sprint 2.1 phase 5.
--
-- Data note: tag -> category backfill already ran in
-- 20261127010000_discovery_taxonomy_seed.sql, so no mapped membership is lost.
-- Unmapped freeform tags (e.g. pack "Tanzania" -> life-in-tanzania was mapped;
-- anything outside the 22-term seed map) are dropped with the columns.

alter table public.packs drop column if exists tags;
alter table public.templates drop column if exists tags;
alter table public.lessons drop column if exists skill_tag;
