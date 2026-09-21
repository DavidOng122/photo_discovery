-- walks
create policy "Users can view own walks" on public.walks for select using (auth.uid() = user_id);
create policy "Users can insert own walks" on public.walks for insert with check (auth.uid() = user_id);
create policy "Users can update own walks" on public.walks for update using (auth.uid() = user_id);
create policy "Users can delete own walks" on public.walks for delete using (auth.uid() = user_id);

-- walk_photos
create policy "Users can view own walk photos" on public.walk_photos for select using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can insert own walk photos" on public.walk_photos for insert with check (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can update own walk photos" on public.walk_photos for update using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can delete own walk photos" on public.walk_photos for delete using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);

-- discovery_tags
create policy "Users can view own discovery tags" on public.discovery_tags for select using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can insert own discovery tags" on public.discovery_tags for insert with check (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can update own discovery tags" on public.discovery_tags for update using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can delete own discovery tags" on public.discovery_tags for delete using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);

-- recommendation_sets
create policy "Users can view own recommendation sets" on public.recommendation_sets for select using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can insert own recommendation sets" on public.recommendation_sets for insert with check (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can update own recommendation sets" on public.recommendation_sets for update using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);
create policy "Users can delete own recommendation sets" on public.recommendation_sets for delete using (
  exists (select 1 from public.walks w where w.id = walk_id and w.user_id = auth.uid())
);

-- recommended_places
create policy "Users can view own recommended places" on public.recommended_places for select using (
  exists (
    select 1 from public.recommendation_sets rs
    join public.walks w on w.id = rs.walk_id
    where rs.id = recommendation_set_id and w.user_id = auth.uid()
  )
);
create policy "Users can insert own recommended places" on public.recommended_places for insert with check (
  exists (
    select 1 from public.recommendation_sets rs
    join public.walks w on w.id = rs.walk_id
    where rs.id = recommendation_set_id and w.user_id = auth.uid()
  )
);
create policy "Users can update own recommended places" on public.recommended_places for update using (
  exists (
    select 1 from public.recommendation_sets rs
    join public.walks w on w.id = rs.walk_id
    where rs.id = recommendation_set_id and w.user_id = auth.uid()
  )
);
create policy "Users can delete own recommended places" on public.recommended_places for delete using (
  exists (
    select 1 from public.recommendation_sets rs
    join public.walks w on w.id = rs.walk_id
    where rs.id = recommendation_set_id and w.user_id = auth.uid()
  )
);

-- recommended_place_tags
create policy "Users can view own recommended place tags" on public.recommended_place_tags for select using (
  exists (
    select 1 from public.recommended_places rp
    join public.recommendation_sets rs on rs.id = rp.recommendation_set_id
    join public.walks w on w.id = rs.walk_id
    where rp.id = recommended_place_id and w.user_id = auth.uid()
  )
);
create policy "Users can insert own recommended place tags" on public.recommended_place_tags for insert with check (
  exists (
    select 1 from public.recommended_places rp
    join public.recommendation_sets rs on rs.id = rp.recommendation_set_id
    join public.walks w on w.id = rs.walk_id
    where rp.id = recommended_place_id and w.user_id = auth.uid()
  )
);
create policy "Users can delete own recommended place tags" on public.recommended_place_tags for delete using (
  exists (
    select 1 from public.recommended_places rp
    join public.recommendation_sets rs on rs.id = rp.recommendation_set_id
    join public.walks w on w.id = rs.walk_id
    where rp.id = recommended_place_id and w.user_id = auth.uid()
  )
);

-- saved_places
create policy "Users can view own saved places" on public.saved_places for select using (auth.uid() = user_id);
create policy "Users can insert own saved places" on public.saved_places for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved places" on public.saved_places for delete using (auth.uid() = user_id);
