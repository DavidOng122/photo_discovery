create table public.saved_places (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  source_recommended_place_id uuid,

  name text not null,

  area text,

  description text not null,

  image_url text,

  google_maps_query text not null,

  matched_tags jsonb
    not null
    default '[]'::jsonb,

  created_at timestamptz
    not null
    default now()
);

create index saved_places_user_id_created_at_idx
on public.saved_places(user_id, created_at desc);
