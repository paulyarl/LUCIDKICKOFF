-- Optional lesson-type guide data for coloring templates.
-- Shape matches the lesson step specs so canvas + lessons share one model:
--   { "targets": [{x,y}...] }  → dot-to-dot (ordered, normalized 0..1 coords)
--   { "path":    [{x,y}...] }  → stroke-path trace guide (normalized 0..1)
alter table public.templates
  add column if not exists guide jsonb;

comment on column public.templates.guide is
  'Lesson-type guide overlay: dot-to-dot targets and/or stroke-path trace path, normalized 0..1 coordinates';
