import { createClient } from '@/lib/supabase/browser';

export async function deleteWalkPhotos(storagePaths: string[]) {
  if (storagePaths.length === 0) return;
  
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from('walk-photos')
    .remove(storagePaths);
    
  if (error) {
    console.error('Failed to delete walk photos:', error);
    throw error;
  }
}
