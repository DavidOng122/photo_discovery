create or replace function public.save_discovery_analysis(
  p_walk_id uuid,
  p_title text,
  p_tags jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_walk public.walks%rowtype;
  v_tag jsonb;
  v_category text;
begin
  -- 1 & 2. Verify walk exists and belongs to the authenticated user
  select * into v_walk
  from public.walks
  where id = p_walk_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Walk not found or access denied';
  end if;

  -- 3. Require current status = ANALYZING
  if v_walk.status != 'ANALYZING' then
    raise exception 'Invalid walk state: must be ANALYZING';
  end if;

  -- 4. Ensure no existing Discovery Tags remain for this walk (retry safety)
  delete from public.discovery_tags where walk_id = p_walk_id;

  -- 6 & 7. Validate tag payload and Insert all Discovery Tags
  for v_tag in select * from jsonb_array_elements(p_tags)
  loop
    v_category := v_tag->>'category';
    
    if v_category not in ('Culture', 'Architecture', 'Nature', 'History', 'Local Life') then
      raise exception 'Invalid category: %', v_category;
    end if;

    if v_tag->>'label' is null or v_tag->>'reason' is null then
      raise exception 'Tag missing required fields';
    end if;

    insert into public.discovery_tags (
      walk_id,
      label,
      category,
      reason,
      selected,
      selected_at
    ) values (
      p_walk_id,
      v_tag->>'label',
      v_category,
      v_tag->>'reason',
      false,
      null
    );
  end loop;

  -- 5. Update Walk title & status to TAG_SELECTION
  update public.walks
  set 
    title = p_title,
    status = 'TAG_SELECTION'
  where id = p_walk_id;

end;
$$;
