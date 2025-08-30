-- Add rating aggregates to existing entities and maintain via triggers

-- Packs
alter table if exists public.packs
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count int not null default 0;

-- Templates
alter table if exists public.templates
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count int not null default 0;

-- Carousels (already created in prior migration)
alter table if exists public.carousels
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count int not null default 0;

-- Recompute helpers
create or replace function public.recompute_pack_rating(p_id uuid)
returns void language sql as $$
  update public.packs p
  set rating_avg = coalesce(sub.avg, 0),
      rating_count = coalesce(sub.cnt, 0)
  from (
    select avg(rating)::numeric(3,2) as avg, count(*) as cnt
    from public.user_ratings
    where entity_type = 'pack' and entity_id = p_id
  ) sub
  where p.id = p_id;
$$;

create or replace function public.recompute_template_rating(t_id uuid)
returns void language sql as $$
  update public.templates t
  set rating_avg = coalesce(sub.avg, 0),
      rating_count = coalesce(sub.cnt, 0)
  from (
    select avg(rating)::numeric(3,2) as avg, count(*) as cnt
    from public.user_ratings
    where entity_type = 'template' and entity_id = t_id
  ) sub
  where t.id = t_id;
$$;

create or replace function public.recompute_carousel_rating(c_id uuid)
returns void language sql as $$
  update public.carousels c
  set rating_avg = coalesce(sub.avg, 0),
      rating_count = coalesce(sub.cnt, 0)
  from (
    select avg(rating)::numeric(3,2) as avg, count(*) as cnt
    from public.user_ratings
    where entity_type = 'carousel' and entity_id = c_id
  ) sub
  where c.id = c_id;
$$;

-- Unified trigger to detect changed row and recompute appropriate aggregate
create or replace function public.user_ratings_recompute_aggregates()
returns trigger language plpgsql as $$
declare
  et public.entity_type;
  eid uuid;
begin
  if (TG_OP = 'DELETE') then
    et := OLD.entity_type;
    eid := OLD.entity_id;
  else
    et := NEW.entity_type;
    eid := NEW.entity_id;
  end if;

  if et = 'pack' then
    perform public.recompute_pack_rating(eid);
  elsif et = 'template' then
    perform public.recompute_template_rating(eid);
  elsif et = 'carousel' then
    perform public.recompute_carousel_rating(eid);
  end if;

  return null;
end;
$$;

drop trigger if exists trg_user_ratings_recompute on public.user_ratings;
create trigger trg_user_ratings_recompute
after insert or update or delete on public.user_ratings
for each row execute function public.user_ratings_recompute_aggregates();

-- Backfill existing aggregates
-- Packs
update public.packs p set
  rating_avg = sub.avg,
  rating_count = sub.cnt
from (
  select entity_id, avg(rating)::numeric(3,2) as avg, count(*) as cnt
  from public.user_ratings where entity_type = 'pack'
  group by entity_id
) sub
where p.id = sub.entity_id;

-- Templates
update public.templates t set
  rating_avg = sub.avg,
  rating_count = sub.cnt
from (
  select entity_id, avg(rating)::numeric(3,2) as avg, count(*) as cnt
  from public.user_ratings where entity_type = 'template'
  group by entity_id
) sub
where t.id = sub.entity_id;

-- Carousels
update public.carousels c set
  rating_avg = sub.avg,
  rating_count = sub.cnt
from (
  select entity_id, avg(rating)::numeric(3,2) as avg, count(*) as cnt
  from public.user_ratings where entity_type = 'carousel'
  group by entity_id
) sub
where c.id = sub.entity_id;
