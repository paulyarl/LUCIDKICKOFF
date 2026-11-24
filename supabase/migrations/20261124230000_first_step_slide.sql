-- A lesson must start with a slide; activities cannot be first.
create or replace function public.enforce_first_step_slide()
returns trigger language plpgsql as $$
begin
  if new.order_index = 0 and new.type <> 'slide' then
    raise exception 'the first step must be a slide';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_first_step_slide on public.lesson_steps;
create trigger enforce_first_step_slide
  before insert or update of order_index, type on public.lesson_steps
  for each row execute function public.enforce_first_step_slide();
