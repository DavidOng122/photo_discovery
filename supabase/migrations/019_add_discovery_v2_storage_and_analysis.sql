-- 1. walk_photos 新增字段 (可空)
ALTER TABLE walk_photos
  ADD COLUMN analysis_storage_path text,
  ADD COLUMN analysis_width integer,
  ADD COLUMN analysis_height integer;

-- 2. 新建 walk_analyses 表
CREATE TABLE walk_analyses (
  walk_id uuid primary key references walks(id) on delete cascade,
  observations jsonb not null,
  analysis_version text not null default 'discovery-v1',
  vision_provider text not null,
  vision_model text not null,
  analysis_duration_ms integer not null,
  input_tokens integer null,
  output_tokens integer null,
  image_tokens integer null,
  retry_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. walks 新增状态追踪时间戳
ALTER TABLE walks
  ADD COLUMN analysis_started_at timestamptz null,
  ADD COLUMN recommendation_started_at timestamptz null;

-- 4. recommendation_sets 新增关联 V2
ALTER TABLE recommendation_sets
  ADD COLUMN selected_discovery_id uuid null references discovery_tags(id) on delete restrict,
  ADD COLUMN recommendation_version text null default 'discovery-v1',
  ADD COLUMN recommendation_duration_ms integer null,
  ADD COLUMN input_tokens integer null,
  ADD COLUMN output_tokens integer null,
  ADD COLUMN retry_count smallint null;

-- 5. 新建 ai_request_metrics
CREATE TABLE ai_request_metrics (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references walks(id) on delete cascade,
  stage text not null,
  analysis_version text not null,
  provider text not null,
  model text not null,
  duration_ms integer not null,
  retry_count smallint not null default 0,
  input_tokens integer null,
  output_tokens integer null,
  image_tokens integer null,
  success boolean not null,
  failure_code text null,
  created_at timestamptz not null default now()
);

-- 6. recommended_places 新增 Google Places 字段
ALTER TABLE recommended_places
  ADD COLUMN google_place_id text null,
  ADD COLUMN formatted_address text null,
  ADD COLUMN google_photo_reference text null;

-- Enable RLS and Policies
ALTER TABLE walk_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_metrics ENABLE ROW LEVEL SECURITY;

-- walk_analyses policy (owner can select)
CREATE POLICY "Users can view their own walk analyses"
  ON walk_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM walks
      WHERE walks.id = walk_analyses.walk_id
      AND walks.user_id = auth.uid()
    )
  );

-- Add some indices
CREATE INDEX idx_walk_analyses_walk_id ON walk_analyses(walk_id);
CREATE INDEX idx_ai_request_metrics_walk_id ON ai_request_metrics(walk_id);
CREATE INDEX idx_recommendation_sets_selected_discovery_id ON recommendation_sets(selected_discovery_id);
