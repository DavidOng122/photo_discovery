create table public.walks (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  title text,

  location text,

  cover_image_url text,

  status public.walk_status
    not null
    default 'DRAFT',

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  completed_at timestamptz
);

create index walks_user_id_created_at_idx
on public.walks(user_id, created_at desc);
