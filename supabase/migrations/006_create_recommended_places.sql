create table public.recommended_places (
  id uuid primary key default gen_random_uuid(),

  recommendation_set_id uuid not null
    references public.recommendation_sets(id)
    on delete cascade,

  name text not null,

  area text,

  description text not null,

  image_url text,

  google_maps_query text not null,

  source_url text,

  source_domain text,

  sort_order integer not null,

  created_at timestamptz
    not null
    default now(),

  unique (recommendation_set_id, name)
);

create index recommended_places_set_id_idx
on public.recommended_places(recommendation_set_id);
