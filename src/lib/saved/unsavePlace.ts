import { createClient } from '@/lib/supabase/server';

export async function unsavePlace(savedPlaceId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('unsave_place', {
    p_saved_place_id: savedPlaceId,
  });
  if (error) throw error;
}
