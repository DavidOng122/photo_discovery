import { createClient } from '@/lib/supabase/server';

export async function getSignedImageUrl(storagePath: string, expiresIn: number = 3600) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from('walk-photos')
    .createSignedUrl(storagePath, expiresIn);
    
  if (error || !data) {
    return null;
  }
  
  return data.signedUrl;
}
