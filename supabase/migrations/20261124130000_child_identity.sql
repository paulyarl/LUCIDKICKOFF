-- 0.3 child identity + 0.15 jurisdiction/consent.
-- Parent-anchored: every child profile has a guardian; no orphan profiles.

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  avatar_url text,
  birthdate date,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  active boolean not null default true,
  learning_interests text[] not null default '{}',
  creative_interests text[] not null default '{}',
  pin_hash text,
  pin_length smallint not null default 4 check (pin_length between 4 and 6),
  pin_failed_attempts int not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_guardians (
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  guardian_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'caregiver')),
  created_at timestamptz not null default now(),
  primary key (child_profile_id, guardian_id)
);

create unique index if not exists child_guardians_one_owner
  on public.child_guardians (child_profile_id) where role = 'owner';

-- Security-definer helper avoids recursive RLS between profiles and guardians.
create or replace function public.is_guardian_of(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.child_guardians
    where child_profile_id = p_child and guardian_id = auth.uid()
  );
$$;

-- Atomic creation: profile + owner row in one transaction.
create or replace function public.create_child_profile(
  p_nickname text,
  p_birthdate date default null,
  p_avatar_url text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.child_profiles (nickname, birthdate, avatar_url)
  values (p_nickname, p_birthdate, p_avatar_url)
  returning id into v_id;
  insert into public.child_guardians (child_profile_id, guardian_id, role)
  values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

grant execute on function public.create_child_profile(text, date, text) to authenticated;

alter table public.child_profiles enable row level security;
alter table public.child_guardians enable row level security;

drop policy if exists "guardians read child profiles" on public.child_profiles;
create policy "guardians read child profiles" on public.child_profiles for select to authenticated
using (public.is_guardian_of(id) or auth_user_id = auth.uid());

drop policy if exists "guardians update child profiles" on public.child_profiles;
create policy "guardians update child profiles" on public.child_profiles for update to authenticated
using (public.is_guardian_of(id)) with check (public.is_guardian_of(id));

drop policy if exists "guardians delete child profiles" on public.child_profiles;
create policy "guardians delete child profiles" on public.child_profiles for delete to authenticated
using (public.is_guardian_of(id));

drop policy if exists "guardians read child guardians" on public.child_guardians;
create policy "guardians read child guardians" on public.child_guardians for select to authenticated
using (guardian_id = auth.uid() or public.is_guardian_of(child_profile_id));

drop policy if exists "guardians manage child guardians" on public.child_guardians;
create policy "guardians manage child guardians" on public.child_guardians for all to authenticated
using (public.is_guardian_of(child_profile_id))
with check (public.is_guardian_of(child_profile_id));

-- Jurisdictions (D26/D29): TZ active, East Africa profiles staged.
create table if not exists public.jurisdiction_profiles (
  code text primary key,
  name text not null,
  primary_law text not null,
  child_age_threshold int,
  consent_basis text not null,
  retention_days int,
  residency_requirement text,
  rights_workflow text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.jurisdiction_profiles
  (code, name, primary_law, child_age_threshold, consent_basis, residency_requirement, rights_workflow, active)
values
  ('TZ', 'Tanzania', 'Personal Data Protection Act 2022', 18,
   'prior written guardian consent', 'cross-border transfer requires consent/safeguards',
   'access/correction/deletion/withdrawal', true),
  ('KE', 'Kenya', 'Data Protection Act 2019', 18,
   'parental/guardian consent + age verification', 'transfer safeguards required',
   'access/correction/deletion/withdrawal', false),
  ('UG', 'Uganda', 'Data Protection and Privacy Act 2019', 18,
   'parental consent for child data', 'transfer safeguards required',
   'access/correction/deletion/withdrawal', false),
  ('RW', 'Rwanda', 'Law No. 058/2021', 18,
   'guardian consent', 'transfer safeguards required',
   'access/correction/deletion/withdrawal', false)
on conflict (code) do nothing;

alter table public.profiles
  add column if not exists jurisdiction text references public.jurisdiction_profiles(code);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  jurisdiction text not null references public.jurisdiction_profiles(code),
  purpose text not null check (purpose in ('child_data', 'cloud_sync', 'community_sharing')),
  policy_version text not null,
  method text not null default 'guardian_checkbox',
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists consent_records_child_idx
  on public.consent_records (child_profile_id, purpose);

alter table public.jurisdiction_profiles enable row level security;
alter table public.consent_records enable row level security;

drop policy if exists "jurisdictions readable" on public.jurisdiction_profiles;
create policy "jurisdictions readable" on public.jurisdiction_profiles
  for select to authenticated using (true);

drop policy if exists "guardians manage consent" on public.consent_records;
create policy "guardians manage consent" on public.consent_records for all to authenticated
using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());
