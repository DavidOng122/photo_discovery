import { createClient } from '@/lib/supabase/server';

export interface SavePlaceResult {
  savedPlaceId: string;
  alreadySaved: boolean;
}

export async function savePlace(recommendedPlaceId: string): Promise<SavePlaceResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_recommended_place', {
    p_recommended_place_id: recommendedPlaceId,
  });

  if (error) throw error;
  return data as SavePlaceResult;
}
