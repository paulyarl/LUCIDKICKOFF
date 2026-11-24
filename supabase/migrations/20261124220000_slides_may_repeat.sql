-- Per-type cardinality: repeatable types may appear multiple times per lesson;
-- non-repeatable types are unique. Policy lives in a table so the registry and
-- DB can stay aligned without hardcoding a slide exception.

drop index if exists public.lesson_steps_one_per_type;

create table if not exists public.step_type_policy (
  type text primary key,
  repeatable boolean not null default false
);

insert into public.step_type_policy (type, repeatable) values
  ('slide', true),
  ('match-pairs', true),
  ('knowledge-check', false),
  ('reward', false),
  ('stroke-path', true),
  ('area-fill', true),
  ('dot-to-dot', true),
  ('layer-order', true)
on conflict (type) do update set repeatable = excluded.repeatable;

create or replace function public.enforce_step_cardinality()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_repeatable boolean;
begin
  select repeatable into v_repeatable
  from public.step_type_policy
  where type = new.type;

  if coalesce(v_repeatable, false) = false and exists (
    select 1
    from public.lesson_steps
    where lesson_id = new.lesson_id
      and type = new.type
      and id <> new.id
  ) then
    raise exception 'step type % may only appear once per lesson', new.type;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_step_cardinality on public.lesson_steps;
create trigger enforce_step_cardinality
  before insert or update on public.lesson_steps
  for each row execute function public.enforce_step_cardinality();
