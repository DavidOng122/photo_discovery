import { createClient } from '@/lib/supabase/browser';
import { CompressedImage } from './compressImage';

export interface UploadPhotoResult {
  storagePath: string;
  width: number;
  height: number;
  photoId: string;
  sortOrder: number;
}

export async function uploadWalkPhoto(
  userId: string,
  walkId: string,
  compressedImage: CompressedImage,
  sortOrder: number
): Promise<UploadPhotoResult> {
  const supabase = createClient();
  const photoId = crypto.randomUUID();
  
  const ext = compressedImage.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = `${userId}/${walkId}/${photoId}.${ext}`;
  
  const { error: uploadError } = await supabase.storage
    .from('walk-photos')
    .upload(storagePath, compressedImage.blob, {
      contentType: compressedImage.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error('Storage upload failed: ' + uploadError.message);
  }

  // Insert into walk_photos
  const { error: dbError } = await supabase
    .from('walk_photos')
    .insert({
      walk_id: walkId,
      storage_path: storagePath,
      public_url: null,
      sort_order: sortOrder,
      width: compressedImage.width,
      height: compressedImage.height,
    });

  if (dbError) {
    throw new Error('Database insert failed: ' + dbError.message);
  }

  return {
    storagePath,
    width: compressedImage.width,
    height: compressedImage.height,
    photoId,
    sortOrder,
  };
}
