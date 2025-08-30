-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3)
);

-- Categories table
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Artworks table
create table if not exists public.artworks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  image_url text not null,
  thumbnail_url text not null,
  width integer,
  height integer,
  is_public boolean default true,
  is_featured boolean default false,
  like_count integer default 0,
  view_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Artwork Categories (many-to-many relationship)
create table if not exists public.artwork_categories (
  id uuid primary key default uuid_generate_v4(),
  artwork_id uuid references public.artworks on delete cascade not null,
  category_id uuid references public.categories on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(artwork_id, category_id)
);

-- Likes table
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  artwork_id uuid references public.artworks on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, artwork_id)
);

-- Favorites table
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  artwork_id uuid references public.artworks on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, artwork_id)
);

-- User activity tracking
create table if not exists public.user_activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  artwork_id uuid references public.artworks on delete cascade not null,
  activity_type text not null, -- 'view', 'like', 'favorite', 'color', 'study'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_artworks_user_id on public.artworks(user_id);
create index idx_artwork_categories_artwork_id on public.artwork_categories(artwork_id);
create index idx_artwork_categories_category_id on public.artwork_categories(category_id);
create index idx_likes_user_id on public.likes(user_id);
create index idx_likes_artwork_id on public.likes(artwork_id);
create index idx_favorites_user_id on public.favorites(user_id);
create index idx_favorites_artwork_id on public.favorites(artwork_id);
create index idx_user_activities_user_id on public.user_activities(user_id);
create index idx_user_activities_artwork_id on public.user_activities(artwork_id);
create index idx_user_activities_created_at on public.user_activities(created_at);

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_categories enable row level security;
alter table public.likes enable row level security;
alter table public.favorites enable row level security;
alter table public.user_activities enable row level security;

-- Profiles RLS policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using (true);

create policy "Users can update their own profile."
  on profiles for update
  using (auth.uid() = id);

-- Categories RLS policies
create policy "Categories are viewable by everyone."
  on categories for select
  using (true);

-- Artworks RLS policies
create policy "Public artworks are viewable by everyone."
  on artworks for select
  using (is_public = true);

create policy "Users can view their own artworks."
  on artworks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own artworks."
  on artworks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own artworks."
  on artworks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own artworks."
  on artworks for delete
  using (auth.uid() = user_id);

-- Artwork Categories RLS policies
create policy "Artwork categories are viewable by everyone."
  on artwork_categories for select
  using (true);

-- Likes RLS policies
create policy "Users can view their own likes."
  on likes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own likes."
  on likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes."
  on likes for delete
  using (auth.uid() = user_id);

-- Favorites RLS policies
create policy "Users can view their own favorites."
  on favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites."
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own favorites."
  on favorites for update
  using (auth.uid() = user_id);

create policy "Users can delete their own favorites."
  on favorites for delete
  using (auth.uid() = user_id);

-- User Activities RLS policies
create policy "Users can view their own activities."
  on user_activities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own activities."
  on user_activities for insert
  with check (auth.uid() = user_id);

-- Create a function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language 'plpgsql';

-- Create triggers to update updated_at columns
create trigger handle_updated_at_profiles
  before update on public.profiles
  for each row
  execute function update_updated_at_column();

create trigger handle_updated_at_artworks
  before update on public.artworks
  for each row
  execute function update_updated_at_column();

create trigger handle_updated_at_favorites
  before update on public.favorites
  for each row
  execute function update_updated_at_column();

-- Function to update like count
create or replace function update_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.artworks
    set like_count = like_count + 1
    where id = new.artwork_id;
  elsif tg_op = 'DELETE' then
    update public.artworks
    set like_count = greatest(0, like_count - 1)
    where id = old.artwork_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create trigger for like count
create trigger update_artwork_like_count
  after insert or delete on public.likes
  for each row
  execute function update_like_count();

-- Function to track user activities
create or replace function track_user_activity()
returns trigger as $$
begin
  insert into public.user_activities (user_id, artwork_id, activity_type)
  values (new.user_id, new.artwork_id, tg_op = 'INSERT' and tg_table_name = 'likes' 
          then 'like' 
          when tg_table_name = 'favorites' then 'favorite' 
          else 'other' end);
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers for user activities
create trigger track_like_activity
  after insert or delete on public.likes
  for each row
  execute function track_user_activity();

create trigger track_favorite_activity
  after insert or update or delete on public.favorites
  for each row
  execute function track_user_activity();

-- Create a view for trending artworks
create or replace view public.trending_artworks as
select 
  a.*,
  u.username,
  u.avatar_url as user_avatar_url,
  count(l.id) as like_count_7d,
  count(ua.id) as view_count_7d,
  count(l.id) * 2 + count(ua.id) * 0.5 + 
  (case when a.is_featured then 10 else 0 end) as trending_score
from 
  public.artworks a
  left join public.profiles u on a.user_id = u.id
  left join public.likes l on a.id = l.artwork_id and l.created_at > (now() - interval '7 days')
  left join public.user_activities ua on a.id = ua.artwork_id 
    and ua.activity_type = 'view' 
    and ua.created_at > (now() - interval '7 days')
where 
  a.is_public = true
  and a.created_at > (now() - interval '30 days')
group by 
  a.id, u.username, u.avatar_url
order by 
  trending_score desc
limit 100;

-- Create a view for user's recently visited artworks
create or replace view public.user_recent_artworks as
select 
  ua.user_id,
  a.*,
  u.username,
  u.avatar_url as user_avatar_url,
  max(ua.created_at) as last_visited_at,
  count(ua.id) as visit_count
from 
  public.user_activities ua
  join public.artworks a on ua.artwork_id = a.id
  join public.profiles u on a.user_id = u.id
where 
  ua.activity_type = 'view'
  and a.is_public = true
group by 
  ua.user_id, a.id, u.username, u.avatar_url
order by 
  last_visited_at desc;
