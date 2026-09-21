import { IMAGE_MAX_EDGE, IMAGE_QUALITY } from '@/constants/images';

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions preserving aspect ratio
      if (Math.max(width, height) > IMAGE_MAX_EDGE) {
        if (width > height) {
          height = Math.round((height * IMAGE_MAX_EDGE) / width);
          width = IMAGE_MAX_EDGE;
        } else {
          width = Math.round((width * IMAGE_MAX_EDGE) / height);
          height = IMAGE_MAX_EDGE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      const preferredMimeType = 'image/webp';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              width,
              height,
              mimeType: blob.type,
            });
          } else {
            // Fallback to JPEG if WebP fails
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve({
                    blob: jpegBlob,
                    width,
                    height,
                    mimeType: 'image/jpeg',
                  });
                } else {
                  reject(new Error('Image compression failed'));
                }
              },
              'image/jpeg',
              IMAGE_QUALITY
            );
          }
        },
        preferredMimeType,
        IMAGE_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
