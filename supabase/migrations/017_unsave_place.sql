create or replace function public.unsave_place(
  p_saved_place_id uuid
)
returns void
language plpgsql
security invoker
as $$
declare
  v_saved public.saved_places%rowtype;
begin
  select * into v_saved
  from public.saved_places
  where id = p_saved_place_id;

  if not found then
    raise exception 'Saved place not found';
  end if;

  -- Ownership check
  if v_saved.user_id != auth.uid() then
    raise exception 'Access denied';
  end if;

  delete from public.saved_places where id = p_saved_place_id;
end;
$$;
