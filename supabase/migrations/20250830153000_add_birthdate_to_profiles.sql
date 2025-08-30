-- Adds birthdate to public.profiles so client can compute/display age
-- Safe to run multiple times due to IF NOT EXISTS
alter table if exists public.profiles
  add column if not exists birthdate date;

-- Note: RLS already allows public select on profiles per 20240827221500_initial_schema.sql
-- No policy changes required for reads.
