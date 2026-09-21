create table public.discovery_tags (
  id uuid primary key default gen_random_uuid(),

  walk_id uuid not null
    references public.walks(id)
    on delete cascade,

  label text not null,

  category text not null,

  reason text not null,

  selected boolean
    not null
    default false,

  selected_at timestamptz,

  created_at timestamptz
    not null
    default now()
);

create index discovery_tags_walk_id_idx
on public.discovery_tags(walk_id);
