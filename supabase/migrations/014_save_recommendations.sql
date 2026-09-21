create or replace function public.save_walk_recommendations(
  p_walk_id uuid,
  p_search_query text,
  p_search_provider text,
  p_ai_provider text,
  p_places jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_walk public.walks%rowtype;
  v_set_id uuid;
  v_place jsonb;
  v_place_id uuid;
  v_tag_label text;
  v_tag_id uuid;
  v_matched_tags jsonb;
begin
  -- 1 & 2. Verify walk ownership and lock row
  select * into v_walk
  from public.walks
  where id = p_walk_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Walk not found or access denied';
  end if;

  -- 3. Require status = RECOMMENDING
  if v_walk.status != 'RECOMMENDING' then
    raise exception 'Invalid walk state: must be RECOMMENDING';
  end if;

  -- 4. Verify no successful recommendation set already exists
  if exists (
    select 1 from public.recommendation_sets where walk_id = p_walk_id
  ) then
    raise exception 'Recommendation set already exists for this walk';
  end if;

  -- 5. Create recommendation_sets row
  insert into public.recommendation_sets (
    walk_id,
    search_query,
    search_provider,
    ai_provider
  ) values (
    p_walk_id,
    p_search_query,
    p_search_provider,
    p_ai_provider
  )
  returning id into v_set_id;

  -- 6. Insert recommended_places
  for v_place in select * from jsonb_array_elements(p_places)
  loop
    insert into public.recommended_places (
      recommendation_set_id,
      name,
      area,
      description,
      image_url,
      google_maps_query,
      source_url,
      source_domain
    ) values (
      v_set_id,
      v_place->>'name',
      v_place->>'area',
      v_place->>'description',
      v_place->>'imageUrl',
      v_place->>'googleMapsQuery',
      v_place->>'sourceUrl',
      v_place->>'sourceDomain'
    )
    returning id into v_place_id;

    -- 7. Connect matched Discovery Tags
    v_matched_tags := v_place->'matchedTags';
    if v_matched_tags is not null then
      for v_tag_label in
        select jsonb_array_elements_text(v_matched_tags)
      loop
        select id into v_tag_id
        from public.discovery_tags
        where walk_id = p_walk_id
          and selected = true
          and label = v_tag_label
        limit 1;

        if v_tag_id is not null then
          insert into public.recommended_place_tags (
            recommended_place_id,
            discovery_tag_id
          ) values (
            v_place_id,
            v_tag_id
          )
          on conflict do nothing;
        end if;
      end loop;
    end if;
  end loop;

  -- 8 & 9. Update walk status and completed_at
  update public.walks
  set
    status = 'COMPLETED',
    completed_at = now()
  where id = p_walk_id;

end;
$$;
