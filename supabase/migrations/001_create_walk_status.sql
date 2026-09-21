create type public.walk_status as enum (
  'DRAFT',
  'ANALYZING',
  'TAG_SELECTION',
  'RECOMMENDING',
  'COMPLETED'
);
