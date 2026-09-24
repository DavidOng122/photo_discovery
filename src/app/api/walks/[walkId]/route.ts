import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { getSignedImageUrl } from '@/lib/images/getSignedImageUrl';

interface WalkTag {
  id: string;
  label: string;
  category: string;
  reason: string;
  selected: boolean;
}

interface RecommendedPlaceWithTags {
  id: string;
  name: string;
  area: string | null;
  description: string;
  image_url: string | null;
  google_maps_query: string;
  recommended_place_tags: Array<{
    discovery_tags: { label: string } | null;
  }>;
}

interface RecommendationPlace {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ walkId: string }> }
) {
  const { walkId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: walk, error } = await supabase
    .from('walks')
    .select('id, status, title, location')
    .eq('id', walkId)
    .eq('user_id', user.id)
    .single();

  if (error || !walk) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: walkPhotos } = await supabase
    .from('walk_photos')
    .select('storage_path, sort_order')
    .eq('walk_id', walkId)
    .order('sort_order', { ascending: true })
    .limit(3);

  const photos = (
    await Promise.all(
      (walkPhotos ?? []).map(async (photo) => ({
        url: await getSignedImageUrl(photo.storage_path, 3600),
        sortOrder: photo.sort_order,
      })),
    )
  ).filter((photo): photo is { url: string; sortOrder: number } => Boolean(photo.url));

  let tags: WalkTag[] = [];
  if (['TAG_SELECTION', 'RECOMMENDING', 'COMPLETED'].includes(walk.status)) {
    const { data } = await supabase
      .from('discovery_tags')
      .select('id, label, category, reason, selected')
      .eq('walk_id', walkId);
    tags = data || [];
  }

  let recommendations: { places: RecommendationPlace[] } | null = null;
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
        const typedPlaces = places as unknown as RecommendedPlaceWithTags[];
        const placeIds = typedPlaces.map((place) => place.id);

        const { data: savedRows } = await supabase
          .from('saved_places')
          .select('id, source_recommended_place_id')
          .eq('user_id', user.id)
          .in('source_recommended_place_id', placeIds);

        const savedMap = new Map<string, string>();
        for (const row of savedRows ?? []) {
          if (row.source_recommended_place_id) {
            savedMap.set(row.source_recommended_place_id, row.id);
          }
        }

        recommendations = {
          places: typedPlaces.map((place) => ({
            id: place.id,
            name: place.name,
            area: place.area,
            description: place.description,
            imageUrl: place.image_url,
            googleMapsQuery: place.google_maps_query,
            matchedTags: (place.recommended_place_tags ?? [])
              .map((relation) => relation.discovery_tags?.label)
              .filter((label): label is string => Boolean(label)),
            isSaved: savedMap.has(place.id),
            savedPlaceId: savedMap.get(place.id) ?? null,
          })),
        };
      }
    }
  }

  return NextResponse.json({ walk, photos, tags, recommendations });
}
