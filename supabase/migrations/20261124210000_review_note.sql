-- Review outcome note for rejected/published lessons.
alter table public.lessons add column if not exists review_note text;
