import { createClient } from '@/lib/supabase/server';

export async function getSignedImageUrl(storagePath: string, expiresIn: number = 3600) {
  if (process.env.NODE_ENV === 'development' && storagePath.startsWith('test/')) {
    return 'http://mock-url.com/image.jpg';
  }
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from('walk-photos')
    .createSignedUrl(storagePath, expiresIn);
    
  if (error || !data) {
    return null;
  }
  
  return data.signedUrl;
}
