create table public.recommended_place_tags (
  recommended_place_id uuid not null
    references public.recommended_places(id)
    on delete cascade,

  discovery_tag_id uuid not null
    references public.discovery_tags(id)
    on delete cascade,

  primary key (
    recommended_place_id,
    discovery_tag_id
  )
);
