create table public.recommendation_sets (
  id uuid primary key default gen_random_uuid(),

  walk_id uuid not null unique
    references public.walks(id)
    on delete cascade,

  search_query text,

  search_provider text,

  ai_provider text,

  created_at timestamptz
    not null
    default now()
);
