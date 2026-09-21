import { createClient } from '@/lib/supabase/server';

export async function verifyWalkOwnership(walkId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('walks')
    .select('id')
    .eq('id', walkId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }
  
  return true;
}
