-- Backfill missing rows in public.profiles for existing auth users
-- Safe to run multiple times due to NOT EXISTS filter
insert into public.profiles (id, username)
select u.id, coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Optional: ensure birthdate column exists (no-op if already present)
alter table if exists public.profiles
  add column if not exists birthdate date;
