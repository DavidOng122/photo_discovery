-- Partial unique index: one saved record per user per source recommended place
create unique index if not exists saved_places_user_source_unique
  on public.saved_places (user_id, source_recommended_place_id)
  where source_recommended_place_id is not null;
