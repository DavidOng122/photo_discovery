-- Insert the bucket
insert into storage.buckets (id, name, public) 
values ('walk-photos', 'walk-photos', false)
on conflict (id) do nothing;

-- Users can upload to their own folder path
create policy "Users can upload their own walk photos"
on storage.objects for insert
with check (
  bucket_id = 'walk-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own walk photos
create policy "Users can view their own walk photos"
on storage.objects for select
using (
  bucket_id = 'walk-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own walk photos
create policy "Users can delete their own walk photos"
on storage.objects for delete
using (
  bucket_id = 'walk-photos' 
  and (storage.foldername(name))[1] = auth.uid()::text
);
