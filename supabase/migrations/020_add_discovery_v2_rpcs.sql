-- 1. save_discovery_analysis_v2
CREATE OR REPLACE FUNCTION save_discovery_analysis_v2(
  p_walk_id uuid,
  p_title text,
  p_observations jsonb,
  p_discoveries jsonb,
  p_analysis_version text,
  p_metrics jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_walk_status walk_status;
  v_user_id uuid;
  v_discovery jsonb;
BEGIN
  -- Validate walk ownership and lock row
  SELECT status, user_id INTO v_walk_status, v_user_id
  FROM walks
  WHERE id = p_walk_id
  FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_walk_status != 'ANALYZING' THEN
    RAISE EXCEPTION 'Walk is not in ANALYZING status';
  END IF;

  -- Upsert walk_analyses
  INSERT INTO walk_analyses (
    walk_id, observations, analysis_version, vision_provider, vision_model,
    analysis_duration_ms, input_tokens, output_tokens, image_tokens, retry_count
  ) VALUES (
    p_walk_id, p_observations, p_analysis_version, 
    p_metrics->>'provider', p_metrics->>'model',
    (p_metrics->>'duration_ms')::integer,
    (p_metrics->>'input_tokens')::integer,
    (p_metrics->>'output_tokens')::integer,
    (p_metrics->>'image_tokens')::integer,
    (p_metrics->>'retry_count')::smallint
  )
  ON CONFLICT (walk_id) DO UPDATE SET
    observations = EXCLUDED.observations,
    analysis_version = EXCLUDED.analysis_version,
    vision_provider = EXCLUDED.vision_provider,
    vision_model = EXCLUDED.vision_model,
    analysis_duration_ms = EXCLUDED.analysis_duration_ms,
    input_tokens = EXCLUDED.input_tokens,
    output_tokens = EXCLUDED.output_tokens,
    image_tokens = EXCLUDED.image_tokens,
    retry_count = EXCLUDED.retry_count,
    updated_at = now();

  -- Clear old tags
  DELETE FROM discovery_tags WHERE walk_id = p_walk_id;

  -- Insert new discoveries as discovery_tags
  FOR v_discovery IN SELECT * FROM jsonb_array_elements(p_discoveries)
  LOOP
    INSERT INTO discovery_tags (
      walk_id, label, category, reason
    ) VALUES (
      p_walk_id, 
      v_discovery->>'phrase', 
      v_discovery->>'lens', 
      v_discovery->>'explanation'
    );
  END LOOP;

  -- Update walk
  UPDATE walks
  SET status = 'TAG_SELECTION',
      title = p_title,
      analysis_started_at = NULL,
      updated_at = now()
  WHERE id = p_walk_id;

  -- Insert metric
  INSERT INTO ai_request_metrics (
    walk_id, stage, analysis_version, provider, model, duration_ms, retry_count,
    input_tokens, output_tokens, image_tokens, success, failure_code
  ) VALUES (
    p_walk_id, 'vision', p_analysis_version,
    p_metrics->>'provider', p_metrics->>'model', (p_metrics->>'duration_ms')::integer,
    (p_metrics->>'retry_count')::smallint, (p_metrics->>'input_tokens')::integer,
    (p_metrics->>'output_tokens')::integer, (p_metrics->>'image_tokens')::integer,
    true, NULL
  );

END;
$$;


-- 2. confirm_discovery_v2
CREATE OR REPLACE FUNCTION confirm_discovery_v2(
  p_walk_id uuid,
  p_selected_discovery_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_walk_status walk_status;
  v_user_id uuid;
  v_discovery_walk_id uuid;
  v_currently_selected boolean;
  v_existing_selected_id uuid;
BEGIN
  -- Validate walk ownership and lock row
  SELECT status, user_id INTO v_walk_status, v_user_id
  FROM walks
  WHERE id = p_walk_id
  FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Once RECOMMENDING or COMPLETED, the selection is permanently locked.
  -- Idempotent retry with the same ID is allowed; different ID is rejected.
  IF v_walk_status IN ('RECOMMENDING', 'COMPLETED') THEN
    SELECT id INTO v_existing_selected_id
    FROM discovery_tags
    WHERE walk_id = p_walk_id AND selected = true
    LIMIT 1;

    IF v_existing_selected_id = p_selected_discovery_id THEN
      -- Same ID: idempotent success — return without changing anything.
      RETURN;
    ELSE
      RAISE EXCEPTION 'SELECTION_ALREADY_CONFIRMED: Discovery selection is locked after recommendation has begun';
    END IF;
  END IF;

  IF v_walk_status != 'TAG_SELECTION' THEN
    RAISE EXCEPTION 'Walk is not in valid status for selection';
  END IF;

  -- Validate discovery option belongs to this walk
  SELECT walk_id, selected INTO v_discovery_walk_id, v_currently_selected
  FROM discovery_tags
  WHERE id = p_selected_discovery_id
  FOR UPDATE;

  IF v_discovery_walk_id IS NULL OR v_discovery_walk_id != p_walk_id THEN
    RAISE EXCEPTION 'Discovery option does not belong to this walk';
  END IF;

  IF v_currently_selected THEN
    -- Already selected by a concurrent request: idempotent success.
    -- Transition status if still TAG_SELECTION.
    UPDATE walks
    SET status = 'RECOMMENDING', updated_at = now()
    WHERE id = p_walk_id AND status = 'TAG_SELECTION';
    RETURN;
  END IF;

  -- Clear any previous selection (should be none in TAG_SELECTION, but guard anyway)
  UPDATE discovery_tags
  SET selected = false, selected_at = NULL
  WHERE walk_id = p_walk_id;

  -- Set new selection
  UPDATE discovery_tags
  SET selected = true, selected_at = now()
  WHERE id = p_selected_discovery_id;

  -- Transition walk to RECOMMENDING
  UPDATE walks
  SET status = 'RECOMMENDING', updated_at = now()
  WHERE id = p_walk_id AND status = 'TAG_SELECTION';
END;
$$;



-- 3. save_walk_recommendations_v2
CREATE OR REPLACE FUNCTION save_walk_recommendations_v2(
  p_walk_id uuid,
  p_selected_discovery_id uuid,
  p_places jsonb,
  p_metadata jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_walk_status walk_status;
  v_user_id uuid;
  v_recommendation_set_id uuid;
  v_place jsonb;
  v_place_id uuid;
  v_idx integer := 0;
BEGIN
  -- Validate walk
  SELECT status, user_id INTO v_walk_status, v_user_id
  FROM walks
  WHERE id = p_walk_id
  FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_walk_status != 'RECOMMENDING' THEN
    RAISE EXCEPTION 'Walk is not in RECOMMENDING status';
  END IF;

  -- Validate selected discovery matches
  IF NOT EXISTS (
    SELECT 1 FROM discovery_tags
    WHERE id = p_selected_discovery_id AND walk_id = p_walk_id AND selected = true
  ) THEN
    RAISE EXCEPTION 'Selected discovery does not match';
  END IF;

  -- Remove old pending/failed set if any for this discovery
  DELETE FROM recommendation_sets
  WHERE walk_id = p_walk_id;

  -- Create recommendation set
  INSERT INTO recommendation_sets (
    walk_id, selected_discovery_id, recommendation_version, 
    recommendation_duration_ms, input_tokens, output_tokens, retry_count
  ) VALUES (
    p_walk_id, p_selected_discovery_id, p_metadata->>'recommendation_version',
    (p_metadata->>'duration_ms')::integer,
    (p_metadata->>'input_tokens')::integer,
    (p_metadata->>'output_tokens')::integer,
    (p_metadata->>'retry_count')::smallint
  ) RETURNING id INTO v_recommendation_set_id;

  -- Insert places
  FOR v_place IN SELECT * FROM jsonb_array_elements(p_places)
  LOOP
    INSERT INTO recommended_places (
      recommendation_set_id,
      name,
      area,
      description,
      google_maps_query,
      sort_order,
      google_place_id,
      formatted_address,
      google_photo_reference
    ) VALUES (
      v_recommendation_set_id,
      v_place->>'name',
      v_place->>'area',
      v_place->>'description',
      v_place->>'google_maps_query',
      v_idx,
      v_place->>'google_place_id',
      v_place->>'formatted_address',
      v_place->>'google_photo_reference'
    ) RETURNING id INTO v_place_id;

    -- Connect place to the single selected discovery tag for backward UI compatibility
    INSERT INTO recommended_place_tags (
      recommended_place_id, discovery_tag_id
    ) VALUES (
      v_place_id, p_selected_discovery_id
    );

    v_idx := v_idx + 1;
  END LOOP;

  -- Update walk
  UPDATE walks
  SET status = 'COMPLETED',
      recommendation_started_at = NULL,
      updated_at = now()
  WHERE id = p_walk_id;

  -- Insert metric
  INSERT INTO ai_request_metrics (
    walk_id, stage, analysis_version, provider, model, duration_ms, retry_count,
    input_tokens, output_tokens, image_tokens, success, failure_code
  ) VALUES (
    p_walk_id, 'recommendation', p_metadata->>'recommendation_version',
    p_metadata->>'provider', p_metadata->>'model', (p_metadata->>'duration_ms')::integer,
    (p_metadata->>'retry_count')::smallint, (p_metadata->>'input_tokens')::integer,
    (p_metadata->>'output_tokens')::integer, 0,
    true, NULL
  );

END;
$$;
