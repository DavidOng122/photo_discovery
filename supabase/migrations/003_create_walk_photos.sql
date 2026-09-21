create table public.walk_photos (
  id uuid primary key default gen_random_uuid(),

  walk_id uuid not null
    references public.walks(id)
    on delete cascade,

  storage_path text not null,

  public_url text,

  sort_order integer not null,

  width integer,

  height integer,

  created_at timestamptz
    not null
    default now(),

  unique (walk_id, sort_order)
);

create index walk_photos_walk_id_idx
on public.walk_photos(walk_id);
