-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Parent-child relationship table
create table if not exists public.family_relationships (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  child_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(parent_id, child_id)
);

-- Parent PINs
create table if not exists public.parent_pins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  last_used_at timestamp with time zone,
  failed_attempts integer default 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Child OTPs for linking
create table if not exists public.child_link_otps (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references auth.users(id) on delete cascade not null,
  otp_hash text not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Approval requests
create table if not exists public.approval_requests (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references auth.users(id) on delete cascade not null,
  parent_id uuid references auth.users(id) on delete cascade not null,
  request_type text not null, -- e.g., 'unlock', 'purchase', 'content_access'
  status text not null default 'pending', -- 'pending', 'approved', 'denied'
  metadata jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weekly progress materialized view
create materialized view if not exists public.weekly_progress as
with weekly_stats as (
  select
    user_id,
    date_trunc('week', created_at) as week_start,
    count(*) as total_sessions,
    sum(extract(epoch from (ended_at - created_at)) / 60) as total_minutes,
    sum(pages_read) as total_pages,
    max(created_at) as last_activity
  from user_activity_sessions
  group by user_id, date_trunc('week', created_at)
)
select
  user_id,
  week_start,
  total_sessions,
  round(total_minutes) as total_minutes,
  total_pages,
  last_activity,
  now() as last_updated
from weekly_stats;

-- Create indexes
create index if not exists idx_family_relationships_parent on public.family_relationships(parent_id);
create index if not exists idx_family_relationships_child on public.family_relationships(child_id);
create index if not exists idx_approval_requests_child on public.approval_requests(child_id);
create index if not exists idx_approval_requests_parent on public.approval_requests(parent_id);
create index if not exists idx_weekly_progress_user on public.weekly_progress(user_id);

-- RLS Policies
-- Family relationships
alter table public.family_relationships enable row level security;

create policy "Parents can view their children"
on public.family_relationships for select
using (auth.uid() = parent_id);

create policy "Parents can add children"
on public.family_relationships for insert
with check (auth.uid() = parent_id);

-- Parent PINs
alter table public.parent_pins enable row level security;

create policy "Users can manage their own PIN"
on public.parent_pins for all
using (auth.uid() = user_id);

-- Child OTPs
alter table public.child_link_otps enable row level security;

create policy "Children can manage their OTPs"
on public.child_link_otps for all
using (auth.uid() = child_id);

-- Approval requests
alter table public.approval_requests enable row level security;

create policy "Parents can view their children's requests"
on public.approval_requests for select
using (auth.uid() = parent_id);

create policy "Children can view their own requests"
on public.approval_requests for select
using (auth.uid() = child_id);

create policy "Parents can update their children's requests"
on public.approval_requests for update
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);

create policy "Children can create requests"
on public.approval_requests for insert
with check (auth.uid() = child_id);

-- Weekly progress view
alter table public.weekly_progress owner to authenticated;

grant select on public.weekly_progress to authenticated;

-- Helper functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Set up default user role
  insert into public.profiles (id, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 'child');
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a refresh function for the materialized view
create or replace function public.refresh_weekly_progress()
returns trigger as $$
begin
  refresh materialized view concurrently public.weekly_progress;
  return null;
end;
$$ language plpgsql;

-- Create triggers
create or replace trigger on_user_activity_session_created
after insert or update or delete on public.user_activity_sessions
for each statement
execute function public.refresh_weekly_progress();

-- Create a function to check if parent is authenticated with PIN
create or replace function public.check_parent_auth()
returns boolean as $$
begin
  return exists (
    select 1 
    from public.parent_pins 
    where user_id = auth.uid() 
    and (locked_until is null or locked_until < now())
  );
end;
$$ language plpgsql security definer;
