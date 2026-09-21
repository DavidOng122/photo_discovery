import { createClient } from '@/lib/supabase/server';
import { getSignedImageUrl } from '@/lib/images/getSignedImageUrl';

export interface HomeWalk {
  id: string;
  title: string;
  location: string | null;
  createdAt: string;
  coverImageUrl: string | null;
  selectedTags: string[];
}

export async function getCompletedWalks(): Promise<HomeWalk[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: walks, error } = await supabase
    .from('walks')
    .select(`
      id,
      title,
      location,
      created_at,
      walk_photos ( storage_path, sort_order ),
      discovery_tags ( label, selected )
    `)
    .eq('user_id', user.id)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: false });

  if (error || !walks) return [];

  const result: HomeWalk[] = await Promise.all(
    walks.map(async (walk: any) => {
      // Cover photo: first by sort_order
      const photos = (walk.walk_photos ?? []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      );
      let coverImageUrl: string | null = null;
      if (photos.length > 0) {
        try {
          coverImageUrl = await getSignedImageUrl(photos[0].storage_path, 3600);
        } catch {
          coverImageUrl = null;
        }
      }

      const selectedTags = (walk.discovery_tags ?? [])
        .filter((t: any) => t.selected)
        .map((t: any) => t.label);

      return {
        id: walk.id,
        title: walk.title ?? '無題',
        location: walk.location ?? null,
        createdAt: walk.created_at,
        coverImageUrl,
        selectedTags,
      };
    })
  );

  return result;
}
