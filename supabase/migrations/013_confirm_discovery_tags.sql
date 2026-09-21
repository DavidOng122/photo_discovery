create or replace function public.confirm_discovery_tags(
  p_walk_id uuid,
  p_selected_tag_ids uuid[]
)
returns void
language plpgsql
security invoker
as $$
declare
  v_walk public.walks%rowtype;
  v_match_count int;
  v_num_selected int;
begin
  v_num_selected := array_length(p_selected_tag_ids, 1);
  if v_num_selected is null then
    v_num_selected := 0;
  end if;

  if v_num_selected < 1 or v_num_selected > 3 then
    raise exception 'Must select between 1 and 3 tags';
  end if;

  -- Verify walk exists and belongs to user
  select * into v_walk
  from public.walks
  where id = p_walk_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Walk not found or access denied';
  end if;

  -- Verify status
  if v_walk.status != 'TAG_SELECTION' then
    raise exception 'Invalid walk state: must be TAG_SELECTION';
  end if;

  -- Verify all selected tags belong to this walk
  select count(*) into v_match_count
  from public.discovery_tags
  where walk_id = p_walk_id and id = any(p_selected_tag_ids);

  if v_match_count != v_num_selected then
    raise exception 'One or more tags are invalid or do not belong to this walk';
  end if;

  -- Reset all tags to not selected
  update public.discovery_tags
  set 
    selected = false,
    selected_at = null
  where walk_id = p_walk_id;

  -- Set selected tags
  update public.discovery_tags
  set 
    selected = true,
    selected_at = now()
  where walk_id = p_walk_id and id = any(p_selected_tag_ids);

  -- Update walk status
  update public.walks
  set status = 'RECOMMENDING'
  where id = p_walk_id;

end;
$$;
