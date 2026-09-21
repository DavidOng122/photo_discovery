import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

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

  let tags: any[] = [];
  if (['TAG_SELECTION', 'RECOMMENDING', 'COMPLETED'].includes(walk.status)) {
    const { data } = await supabase
      .from('discovery_tags')
      .select('id, label, category, reason, selected')
      .eq('walk_id', walkId);
    tags = data || [];
  }

  let recommendations: { places: any[] } | null = null;
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
        for (const row of savedRows ?? []) {
          savedMap.set(row.source_recommended_place_id, row.id);
        }

        recommendations = {
          places: places.map((p: any) => ({
            id: p.id,
            name: p.name,
            area: p.area,
            description: p.description,
            imageUrl: p.image_url,
            googleMapsQuery: p.google_maps_query,
            matchedTags: (p.recommended_place_tags ?? [])
              .map((rpt: any) => rpt.discovery_tags?.label)
              .filter(Boolean),
            isSaved: savedMap.has(p.id),
            savedPlaceId: savedMap.get(p.id) ?? null,
          })),
        };
      }
    }
  }

  return NextResponse.json({ walk, tags, recommendations });
}
