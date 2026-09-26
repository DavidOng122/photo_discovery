import { createClient } from '@/lib/supabase/browser';

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
  imageFile: File,
  sortOrder: number
): Promise<UploadPhotoResult> {
  const supabase = createClient();
  const photoId = crypto.randomUUID();
  
  const { width, height } = await getOriginalDimensions(imageFile);
  const ext = getFileExtension(imageFile);
  const storagePath = `${userId}/${walkId}/${photoId}.${ext}`;
  
  const { error: uploadError } = await supabase.storage
    .from('walk-photos')
    .upload(storagePath, imageFile, {
      contentType: imageFile.type || 'application/octet-stream',
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
      width,
      height,
    });

  if (dbError) {
    throw new Error('Database insert failed: ' + dbError.message);
  }

  return {
    storagePath,
    width,
    height,
    photoId,
    sortOrder,
  };
}

function getOriginalDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the original image dimensions'));
    };

    image.src = objectUrl;
  });
}

function getFileExtension(file: File): string {
  const originalExtension = file.name.split('.').pop()?.toLowerCase();
  if (originalExtension && /^[a-z0-9]+$/.test(originalExtension)) return originalExtension;

  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return mimeExtensions[file.type] ?? 'image';
}
