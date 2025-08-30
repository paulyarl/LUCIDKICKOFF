-- RLS Policies for Artworks
create or replace function public.is_artwork_owner(artwork_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.artworks
    where id = artwork_id and user_id = auth.uid()
  );
$$ language sql security definer;

-- Artworks RLS Policies
drop policy if exists "Artworks are viewable by everyone." on public.artworks;
drop policy if exists "Users can insert their own artworks." on public.artworks;
drop policy if exists "Users can update their own artworks." on public.artworks;
drop policy if exists "Users can delete their own artworks." on public.artworks;

-- Public read access to public artworks
create policy "Public artworks are viewable by everyone."
on public.artworks for select
using (is_public = true);

-- Users can see their own private artworks
create policy "Users can view their own private artworks"
on public.artworks for select
using (user_id = auth.uid());

-- CRUD operations for owners
create policy "Users can insert their own artworks"
on public.artworks for insert
with check (user_id = auth.uid());

create policy "Users can update their own artworks"
on public.artworks for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own artworks"
on public.artworks for delete
using (user_id = auth.uid());

-- Favorites RLS Policies
drop policy if exists "Users can view their own favorites" on public.favorites;
drop policy if exists "Users can manage their own favorites" on public.favorites;

-- Users can view their own favorites
create policy "Users can view their own favorites"
on public.favorites for select
using (user_id = auth.uid());

-- Users can manage their own favorites
create policy "Users can manage their own favorites"
on public.favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- User Packs RLS (if user_packs table exists)
-- Note: This assumes a user_packs table exists with owner_id and member_id columns
-- Uncomment and modify if needed
/*
create or replace function public.is_pack_owner(pack_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.user_packs
    where id = pack_id and owner_id = auth.uid()
  );
$$ language sql security definer;

create or replace function public.is_pack_member(pack_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.user_pack_members
    where pack_id = $1 and user_id = auth.uid()
  );
$$ language sql security definer;

-- Pack owners can manage their packs
create policy "Pack owners can manage their packs"
on public.user_packs for all
using (is_pack_owner(id))
with check (is_pack_owner(id));

-- Pack members can view the pack
create policy "Pack members can view their packs"
on public.user_packs for select
using (is_pack_member(id));
*/

-- Parent-Child Approval System
-- Function to check if user is a parent of the child
create or replace function public.is_parent_of(child_id_param uuid)
returns boolean as $$
  select exists (
    select 1 from public.family_relationships
    where parent_id = auth.uid() and child_id = child_id_param
  );
$$ language sql security definer;

-- Approval requests RLS
create policy "Parents can view their children's approval requests"
on public.approval_requests for select
using (auth.uid() = parent_id);

create policy "Children can view their own approval requests"
on public.approval_requests for select
using (auth.uid() = child_id);

create policy "Parents can update approval requests"
on public.approval_requests for update
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);

create policy "Children can create approval requests"
on public.approval_requests for insert
with check (auth.uid() = child_id);

-- Rate Limiting for OTP
-- Create a function to check rate limits
create or replace function public.check_rate_limit(
  user_id_param uuid,
  action_type text,
  max_attempts integer,
  time_window interval
) returns boolean as $$
declare
  attempt_count integer;
  is_rate_limited boolean;
begin
  -- Check if user is rate limited
  select count(*) into attempt_count
  from public.rate_limits
  where user_id = user_id_param
    and action_type = check_rate_limit.action_type
    and created_at > (now() - time_window);
  
  is_rate_limited := attempt_count >= max_attempts;
  
  -- Log the attempt
  insert into public.rate_limits (user_id, action_type)
  values (user_id_param, action_type);
  
  return not is_rate_limited;
end;
$$ language plpgsql security definer;

-- Create rate_limits table if it doesn't exist
create table if not exists public.rate_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  action_type text not null,
  ip_address inet,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for rate limit lookups
create index if not exists idx_rate_limits_user_action on public.rate_limits(user_id, action_type, created_at);

-- Function to clean up old rate limit records
create or replace function public.cleanup_old_rate_limits()
returns trigger as $$
begin
  delete from public.rate_limits
  where created_at < now() - interval '24 hours';
  return null;
end;
$$ language plpgsql security definer;

-- Create a trigger to clean up old rate limits
create or replace trigger trigger_cleanup_rate_limits
after insert on public.rate_limits
execute function public.cleanup_old_rate_limits();

-- Upload Validation
-- Function to validate file uploads
create or replace function public.validate_upload(
  file_size bigint,
  file_type text,
  max_size_mb integer default 10,
  allowed_types text[] default array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) returns jsonb as $$
declare
  result jsonb;
begin
  result := jsonb_build_object('valid', true);
  
  -- Check file size (convert MB to bytes)
  if file_size > (max_size_mb * 1024 * 1024) then
    result := jsonb_build_object(
      'valid', false,
      'error', format('File size exceeds the maximum allowed size of %s MB', max_size_mb)
    );
    return result;
  end if;
  
  -- Check MIME type
  if not (file_type = any(allowed_types)) then
    result := jsonb_build_object(
      'valid', false,
      'error', format('File type %s is not allowed', file_type)
    );
    return result;
  end if;
  
  return result;
end;
$$ language plpgsql security definer;

-- IP-based upload restrictions
create table if not exists public.upload_restrictions (
  id uuid primary key default uuid_generate_v4(),
  ip_address inet not null,
  is_blocked boolean default false,
  block_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

-- Function to check if an IP is blocked
create or replace function public.is_ip_blocked(ip inet)
returns boolean as $$
  select exists (
    select 1 from public.upload_restrictions
    where ip_address = $1 and is_blocked = true
    and (expires_at is null or expires_at > now())
  );
$$ language sql security definer;

-- Function to log upload attempts
create or replace function public.log_upload_attempt(
  user_id_param uuid,
  ip_param inet,
  file_size bigint,
  file_type text,
  was_blocked boolean default false,
  block_reason text default null
) returns void as $$
begin
  insert into public.upload_logs (
    user_id,
    ip_address,
    file_size,
    file_type,
    was_blocked,
    block_reason
  ) values (
    user_id_param,
    ip_param,
    file_size,
    file_type,
    was_blocked,
    block_reason
  );
end;
$$ language plpgsql security definer;

-- Create upload logs table if it doesn't exist
create table if not exists public.upload_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete set null,
  ip_address inet not null,
  file_size bigint not null,
  file_type text not null,
  was_blocked boolean not null,
  block_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for upload logs
create index if not exists idx_upload_logs_user on public.upload_logs(user_id);
create index if not exists idx_upload_logs_ip on public.upload_logs(ip_address);
create index if not exists idx_upload_logs_created on public.upload_logs(created_at);

-- Function to handle file uploads with validation
create or replace function public.handle_file_upload(
  file_name text,
  file_size bigint,
  file_type text,
  file_hash text,
  user_ip inet,
  user_id_param uuid default auth.uid(),
  max_size_mb integer default 10
) returns jsonb as $$
declare
  validation_result jsonb;
  is_blocked boolean;
  upload_result jsonb;
begin
  -- Check if IP is blocked
  is_blocked := public.is_ip_blocked(user_ip);
  if is_blocked then
    perform public.log_upload_attempt(
      user_id_param,
      user_ip,
      file_size,
      file_type,
      true,
      'IP address is blocked'
    );
    return jsonb_build_object(
      'success', false,
      'error', 'Uploads are not allowed from this IP address',
      'code', 'IP_BLOCKED'
    );
  end if;
  
  -- Validate file
  validation_result := public.validate_upload(file_size, file_type, max_size_mb);
  if not (validation_result->>'valid')::boolean then
    perform public.log_upload_attempt(
      user_id_param,
      user_ip,
      file_size,
      file_type,
      true,
      validation_result->>'error'
    );
    return jsonb_build_object(
      'success', false,
      'error', validation_result->>'error',
      'code', 'VALIDATION_FAILED'
    );
  end if;
  
  -- Log successful validation
  perform public.log_upload_attempt(
    user_id_param,
    user_ip,
    file_size,
    file_type,
    false
  );
  
  -- Here you would typically handle the actual file upload to storage
  -- and return the file URL or path
  
  return jsonb_build_object(
    'success', true,
    'message', 'File upload validated successfully',
    'file_name', file_name,
    'file_size', file_size,
    'file_type', file_type,
    'file_hash', file_hash
  );
end;
$$ language plpgsql security definer;

-- Grant necessary permissions
grant execute on function public.is_artwork_owner(uuid) to authenticated;
grant execute on function public.is_parent_of(uuid) to authenticated;
grant execute on function public.check_rate_limit(uuid, text, integer, interval) to authenticated;
grant execute on function public.validate_upload(bigint, text, integer, text[]) to authenticated;
grant execute on function public.is_ip_blocked(inet) to authenticated;
grant execute on function public.log_upload_attempt(uuid, inet, bigint, text, boolean, text) to authenticated;
grant execute on function public.handle_file_upload(text, bigint, text, text, inet, uuid, integer) to authenticated;

-- Apply RLS to new tables
alter table public.rate_limits enable row level security;
alter table public.upload_restrictions enable row level security;
alter table public.upload_logs enable row level security;

-- RLS policies for rate_limits
create policy "Users can view their own rate limits"
on public.rate_limits for select
using (auth.uid() = user_id);

-- RLS policies for upload_restrictions (admin only)
create policy "Only admins can manage upload restrictions"
on public.upload_restrictions for all
using (exists (
  select 1 from auth.users
  where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
));

-- RLS policies for upload_logs (users can see their own logs, admins can see all)
create policy "Users can view their own upload logs"
on public.upload_logs for select
using (auth.uid() = user_id or exists (
  select 1 from auth.users
  where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
));

-- Create a function to check if a user is an admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
  );
$$ language sql security definer;

-- Create a function to get the current user's role
create or replace function public.get_user_role()
returns text as $$
  select raw_user_meta_data->>'role' from auth.users where id = auth.uid();
$$ language sql security definer;
