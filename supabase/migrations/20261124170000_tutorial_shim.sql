-- 0.12 — tutorials become a read-only compatibility shim over lessons.
-- Writes go to lessons only; this view keeps legacy tutorial content readable.

create or replace view public.lesson_steps_all
with (security_invoker = true) as
select
  id,
  lesson_id,
  order_index,
  type,
  title,
  guide,
  rubric,
  hints,
  created_at,
  updated_at
from public.lesson_steps
union all
select
  ts.id,
  ts.tutorial_id as lesson_id,
  ts.order_index,
  coalesce(ts.step->>'type', 'stroke-path') as type,
  ts.step->>'title' as title,
  ts.step->'guide' as guide,
  ts.step->'rubric' as rubric,
  ts.step->'hints' as hints,
  ts.created_at,
  ts.updated_at
from public.tutorial_steps ts;

grant select on public.lesson_steps_all to authenticated, anon;
