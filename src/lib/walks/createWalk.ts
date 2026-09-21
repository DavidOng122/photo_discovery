import { createClient } from '@/lib/supabase/browser';

export async function createWalk(userId: string, location: string | null) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('walks')
    .insert({
      user_id: userId,
      location: location && location.trim() !== '' ? location.trim() : null,
      status: 'DRAFT',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('Failed to create walk: ' + (error?.message || 'Unknown error'));
  }

  return data.id as string;
}
