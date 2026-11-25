-- E.1 device trust: per-guardian revocation version.
-- Bumping this integer invalidates every lc_device cookie ever minted for the
-- guardian (the "sign out all devices" control in the P1 console).
alter table public.profiles
  add column if not exists device_trust_version integer not null default 1;
