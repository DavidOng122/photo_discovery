create or replace function public.save_recommended_place(
  p_recommended_place_id uuid
)
returns json
language plpgsql
security invoker
as $$
declare
  v_place public.recommended_places%rowtype;
  v_set   public.recommendation_sets%rowtype;
  v_walk  public.walks%rowtype;
  v_tags  text[];
  v_saved_id uuid;
  v_existing_id uuid;
begin
  -- 1. Load recommended place
  select * into v_place
  from public.recommended_places
  where id = p_recommended_place_id;

  if not found then
    raise exception 'Recommended place not found';
  end if;

  -- 2. Traverse to the walk
  select * into v_set
  from public.recommendation_sets
  where id = v_place.recommendation_set_id;

  if not found then
    raise exception 'Recommendation set not found';
  end if;

  select * into v_walk
  from public.walks
  where id = v_set.walk_id;

  -- 3. Verify ownership
  if v_walk.user_id != auth.uid() then
    raise exception 'Access denied';
  end if;

  -- 4. Check for existing saved record (idempotent)
  select id into v_existing_id
  from public.saved_places
  where user_id = auth.uid()
    and source_recommended_place_id = p_recommended_place_id
  limit 1;

  if v_existing_id is not null then
    return json_build_object('savedPlaceId', v_existing_id, 'alreadySaved', true);
  end if;

  -- 5. Collect matched tags from recommended_place_tags → discovery_tags
  select array_agg(dt.label) into v_tags
  from public.recommended_place_tags rpt
  join public.discovery_tags dt on dt.id = rpt.discovery_tag_id
  where rpt.recommended_place_id = p_recommended_place_id;

  -- 6. Insert snapshot into saved_places
  insert into public.saved_places (
    user_id,
    source_recommended_place_id,
    name,
    area,
    description,
    image_url,
    google_maps_query,
    matched_tags
  ) values (
    auth.uid(),
    p_recommended_place_id,
    v_place.name,
    v_place.area,
    v_place.description,
    v_place.image_url,
    v_place.google_maps_query,
    to_json(coalesce(v_tags, array[]::text[]))
  )
  returning id into v_saved_id;

  return json_build_object('savedPlaceId', v_saved_id, 'alreadySaved', false);
end;
$$;
