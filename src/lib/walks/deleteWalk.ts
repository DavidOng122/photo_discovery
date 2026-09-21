import { createClient } from '@/lib/supabase/browser';

export async function deleteWalk(walkId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('walks')
    .delete()
    .eq('id', walkId);
    
  if (error) {
    console.error('Failed to delete walk:', error);
    throw error;
  }
}
