-- Persisted user settings for the Settings & Sync screen.
alter table public.profiles
  add column if not exists settings jsonb not null default '{}'::jsonb;
