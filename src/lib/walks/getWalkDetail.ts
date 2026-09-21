import { createClient } from '@/lib/supabase/server';
import { getSignedImageUrl } from '@/lib/images/getSignedImageUrl';

export interface WalkPhoto {
  id: string;
  storagePath: string;
  sortOrder: number;
  signedUrl: string | null;
}

export interface WalkTag {
  id: string;
  label: string;
  category: string;
  selected: boolean;
}

export interface WalkRecommendedPlace {
  id: string;
  name: string;
  area: string | null;
  description: string;
  imageUrl: string | null;
  googleMapsQuery: string;
  matchedTags: string[];
  isSaved: boolean;
  savedPlaceId: string | null;
}

export interface WalkDetail {
  id: string;
  title: string;
  location: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  photos: WalkPhoto[];
  selectedTags: WalkTag[];
  recommendations: WalkRecommendedPlace[];
}

export async function getWalkDetail(walkId: string): Promise<WalkDetail | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: walk, error } = await supabase
    .from('walks')
    .select('id, title, location, status, created_at, completed_at')
    .eq('id', walkId)
    .eq('user_id', user.id)
    .single();

  if (error || !walk) return null;

  // Photos
  const { data: photosData } = await supabase
    .from('walk_photos')
    .select('id, storage_path, sort_order')
    .eq('walk_id', walkId)
    .order('sort_order', { ascending: true });

  const photos: WalkPhoto[] = await Promise.all(
    (photosData ?? []).map(async (p: any) => {
      let signedUrl: string | null = null;
      try { signedUrl = await getSignedImageUrl(p.storage_path, 3600); } catch {}
      return { id: p.id, storagePath: p.storage_path, sortOrder: p.sort_order, signedUrl };
    })
  );

  // Tags
  const { data: tagsData } = await supabase
    .from('discovery_tags')
    .select('id, label, category, selected')
    .eq('walk_id', walkId);

  const selectedTags: WalkTag[] = (tagsData ?? [])
    .filter((t: any) => t.selected)
    .map((t: any) => ({ id: t.id, label: t.label, category: t.category, selected: t.selected }));

  // Recommendations
  let recommendations: WalkRecommendedPlace[] = [];
  if (walk.status === 'COMPLETED') {
    const { data: set } = await supabase
      .from('recommendation_sets')
      .select('id')
      .eq('walk_id', walkId)
      .single();

    if (set) {
      const { data: places } = await supabase
        .from('recommended_places')
        .select('id, name, area, description, image_url, google_maps_query, recommended_place_tags(discovery_tags(label))')
        .eq('recommendation_set_id', set.id);

      if (places) {
        const placeIds = places.map((p: any) => p.id);
        const { data: savedRows } = await supabase
          .from('saved_places')
          .select('id, source_recommended_place_id')
          .eq('user_id', user.id)
          .in('source_recommended_place_id', placeIds);

        const savedMap = new Map<string, string>();
        for (const row of savedRows ?? []) savedMap.set(row.source_recommended_place_id, row.id);

        recommendations = places.map((p: any) => ({
          id: p.id,
          name: p.name,
          area: p.area,
          description: p.description,
          imageUrl: p.image_url,
          googleMapsQuery: p.google_maps_query,
          matchedTags: (p.recommended_place_tags ?? []).map((rpt: any) => rpt.discovery_tags?.label).filter(Boolean),
          isSaved: savedMap.has(p.id),
          savedPlaceId: savedMap.get(p.id) ?? null,
        }));
      }
    }
  }

  return {
    id: walk.id,
    title: walk.title ?? '無題',
    location: walk.location,
    status: walk.status,
    createdAt: walk.created_at,
    completedAt: walk.completed_at,
    photos,
    selectedTags,
    recommendations,
  };
}
