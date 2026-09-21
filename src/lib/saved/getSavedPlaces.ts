import { createClient } from '@/lib/supabase/server';

export interface SavedPlace {
  id: string;
  name: string;
  area: string | null;
  description: string;
  imageUrl: string | null;
  googleMapsQuery: string;
  matchedTags: string[];
  createdAt: string;
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_places')
    .select('id, name, area, description, image_url, google_maps_query, matched_tags, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    area: row.area,
    description: row.description,
    imageUrl: row.image_url,
    googleMapsQuery: row.google_maps_query,
    matchedTags: Array.isArray(row.matched_tags) ? row.matched_tags : [],
    createdAt: row.created_at,
  }));
}
