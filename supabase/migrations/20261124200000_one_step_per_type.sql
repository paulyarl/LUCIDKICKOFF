-- One step per type per lesson.
create unique index if not exists lesson_steps_one_per_type
  on public.lesson_steps (lesson_id, type);
