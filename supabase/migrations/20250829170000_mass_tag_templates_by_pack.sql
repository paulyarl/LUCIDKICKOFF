-- Mass-tag templates with pack:<pack_slug>
-- Adjust WHERE clauses to match your catalog (by title or image_path patterns).
-- Safe: only appends the tag if missing.

-- Helper CTE for readability (no functions needed)
-- Example mappings:
--   ocean-life: animals, sea creatures
--   jungle-safari: animals
--   space-exploration: sci-fi
--   dinosaur-world: dinosaurs
--   architecture: castle-like

-- 1) Ocean Life (example)
update public.templates t
set tags = case when not ('pack:ocean-life' = any(t.tags)) then array_append(t.tags, 'pack:ocean-life') else t.tags end
where (
  t.title ilike '%Shark%' or
  t.title ilike '%Whale%' or
  t.title ilike '%Octopus%' or
  t.image_path ilike '%shark%' or
  t.image_path ilike '%whale%' or
  t.image_path ilike '%octopus%'
);

-- 2) Jungle Safari (example)
update public.templates t
set tags = case when not ('pack:jungle-safari' = any(t.tags)) then array_append(t.tags, 'pack:jungle-safari') else t.tags end
where (
  t.title ilike '%Lion%' or
  t.title ilike '%Tiger%' or
  t.title ilike '%Elephant%' or
  t.image_path ilike '%lion%' or
  t.image_path ilike '%tiger%' or
  t.image_path ilike '%elephant%'
);

-- 3) Space Exploration (example)
update public.templates t
set tags = case when not ('pack:space-exploration' = any(t.tags)) then array_append(t.tags, 'pack:space-exploration') else t.tags end
where (
  t.title ilike '%Robot%' or
  t.title ilike '%Astronaut%' or
  t.title ilike '%Rocket%' or
  t.image_path ilike '%robot%' or
  t.image_path ilike '%astronaut%' or
  t.image_path ilike '%rocket%'
);

-- 4) Architecture (example covering Castle from seed)
update public.templates t
set tags = case when not ('pack:architecture' = any(t.tags)) then array_append(t.tags, 'pack:architecture') else t.tags end
where (
  t.title ilike '%Castle%' or
  t.image_path ilike '%castle%'
);

-- 5) Nature/Flowers (map to a specific pack if you have one, else comment out)
update public.templates t
set tags = case when not ('pack:nature' = any(t.tags)) then array_append(t.tags, 'pack:nature') else t.tags end
where (
  t.title ilike '%Flower%' or
  t.image_path ilike '%flower%'
);

-- Notes:
-- - Repeat/adjust UPDATE statements per pack. Use ILIKE patterns for robustness.
-- - If you instead want to target by existing template tags (e.g., 'animals'),
--   you can use `where 'animals' = any(t.tags)`.
-- - To verify changes before/after, run:
--     select title, image_path, tags from public.templates order by title;
