-- Security-definer PIN setter: no service-role key needed in the route.
create or replace function public.set_child_pin(
  p_child uuid,
  p_pin_hash text,
  p_pin_length int
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_guardian_of(p_child)) then
    raise exception 'forbidden';
  end if;

  update public.child_profiles
  set pin_hash = p_pin_hash,
      pin_length = p_pin_length,
      pin_failed_attempts = 0,
      pin_locked_until = null
  where id = p_child;
end;
$$;

grant execute on function public.set_child_pin(uuid, text, int) to authenticated;
