-- Learning schema for lessons, tutorials, and user progress
-- Safely create tables if they don't exist

create table if not exists public.lessons (
  id text primary key,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_steps (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  order_index int not null,
  type text not null check (type in ('stroke-path')), -- extend as needed
  title text,
  guide jsonb,           -- e.g., array of points for stroke-path
  rubric jsonb,          -- thresholds, resample options, etc
  hints jsonb,           -- array of { tier, text }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

create table if not exists public.tutorials (
  id text primary key,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutorial_steps (
  id text primary key,
  tutorial_id text not null references public.tutorials(id) on delete cascade,
  order_index int not null,
  -- For simplicity, embed step JSON; alternatively, reference lesson_steps
  step jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tutorial_id, order_index)
);

-- Per-user progress
create table if not exists public.user_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  step_index int not null default 0,
  stars int not null default 0,
  passed_steps int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.user_tutorial_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  tutorial_id text not null references public.tutorials(id) on delete cascade,
  step_index int not null default 0,
  stars int not null default 0,
  passed_steps int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, tutorial_id)
);

-- RLS
alter table public.user_lesson_progress enable row level security;
alter table public.user_tutorial_progress enable row level security;

-- Policies: owners can CRUD their own progress
create policy if not exists "Users can view own lesson progress"
  on public.user_lesson_progress for select
  using (auth.uid() = user_id);

create policy if not exists "Users can upsert own lesson progress"
  on public.user_lesson_progress for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own lesson progress"
  on public.user_lesson_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Users can view own tutorial progress"
  on public.user_tutorial_progress for select
  using (auth.uid() = user_id);

create policy if not exists "Users can upsert own tutorial progress"
  on public.user_tutorial_progress for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own tutorial progress"
  on public.user_tutorial_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helpful updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_lesson_steps_updated
  before update on public.lesson_steps
  for each row execute procedure public.set_updated_at();

create trigger trg_tutorial_steps_updated
  before update on public.tutorial_steps
  for each row execute procedure public.set_updated_at();

create trigger trg_user_lesson_progress_updated
  before update on public.user_lesson_progress
  for each row execute procedure public.set_updated_at();

create trigger trg_user_tutorial_progress_updated
  before update on public.user_tutorial_progress
  for each row execute procedure public.set_updated_at();
