-- 0.1/0.2 — role authority: app_metadata is the source, profiles.role is the mirror.
-- One-time backfill, then user_metadata role writes are blocked.

alter table public.profiles add column if not exists role text;
update public.profiles set role = 'child' where role is null;
alter table public.profiles alter column role set default 'child';
alter table public.profiles alter column role set not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'parent', 'child'));

-- Create profiles for existing auth users (profiles had 0 rows in the revived project).
insert into public.profiles (id, username, role)
select u.id,
       coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
       coalesce(nullif(u.raw_app_meta_data->>'role', ''),
                nullif(u.raw_user_meta_data->>'role', ''), 'child')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- One-time legacy backfill: app_metadata wins, then user_metadata.
update public.profiles p
set role = coalesce(nullif(u.raw_app_meta_data->>'role', ''),
                    nullif(u.raw_user_meta_data->>'role', ''), p.role)
from auth.users u
where u.id = p.id
  and coalesce(nullif(u.raw_app_meta_data->>'role', ''),
               nullif(u.raw_user_meta_data->>'role', '')) is not null
  and p.role is distinct from coalesce(nullif(u.raw_app_meta_data->>'role', ''),
                                       nullif(u.raw_user_meta_data->>'role', ''), p.role);

-- Promote existing roles into app_metadata so JWTs carry them after re-login.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role',
       coalesce(nullif(u.raw_app_meta_data->>'role', ''),
                nullif(u.raw_user_meta_data->>'role', ''), 'child'))
where coalesce(u.raw_app_meta_data->>'role', '') = '';

-- Helpers read the mirror, never user metadata.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.get_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Policies that still consulted raw_user_meta_data.
drop policy if exists "Only admins can manage upload restrictions" on public.upload_restrictions;
create policy "Only admins can manage upload restrictions"
  on public.upload_restrictions for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users can view their own upload logs" on public.upload_logs;
create policy "Users can view their own upload logs"
  on public.upload_logs for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage all pack purchases" on public.pack_purchases;
create policy "Admins can manage all pack purchases"
  on public.pack_purchases for all
  using (public.is_admin()) with check (public.is_admin());

-- Profile creation: role comes from app_metadata only.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_app_meta_data->>'role', ''), 'child')
  )
  on conflict (id) do update
    set role = coalesce(nullif(new.raw_app_meta_data->>'role', ''), public.profiles.role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the mirror in step when app_metadata changes (service-role writes only).
create or replace function public.sync_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set role = coalesce(nullif(new.raw_app_meta_data->>'role', ''), role)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_profile_role on auth.users;
create trigger sync_profile_role
  after update of raw_app_meta_data on auth.users
  for each row execute function public.sync_profile_role();

-- Block self-promotion through user_metadata.
create or replace function public.block_user_metadata_role()
returns trigger language plpgsql as $$
begin
  if new.raw_user_meta_data->>'role' is distinct from old.raw_user_meta_data->>'role' then
    raise exception 'role cannot be changed via user_metadata';
  end if;
  return new;
end;
$$;

drop trigger if exists block_user_metadata_role on auth.users;
create trigger block_user_metadata_role
  before update on auth.users
  for each row execute function public.block_user_metadata_role();

-- Defence in depth on the mirror column itself.
revoke update (role) on public.profiles from authenticated, anon;

create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'role can only be changed by the service role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
