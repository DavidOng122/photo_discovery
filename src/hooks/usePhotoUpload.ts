import { useState, useCallback, useEffect, useRef } from 'react';
import { MAX_PHOTOS } from '@/constants/images';
import { validateImageFiles } from '@/lib/images/validateImage';
import { createWalk } from '@/lib/walks/createWalk';
import { uploadWalkPhoto } from '@/lib/images/uploadWalkPhoto';
import { deleteWalk } from '@/lib/walks/deleteWalk';
import { deleteWalkPhotos } from '@/lib/images/deleteWalkPhotos';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

export interface PreviewFile {
  id: string; // local unique id
  file: File;
  previewUrl: string;
}

export function usePhotoUpload() {
  const [photos, setPhotos] = useState<PreviewFile[]>([]);
  const [location, setLocation] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photosRef = useRef<PreviewFile[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Cleanup object URLs when the upload flow is closed.
  useEffect(() => {
    return () => {
      photosRef.current.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const addFiles = useCallback((filesList: FileList | File[] | null) => {
    if (!filesList) return;
    const filesArray = Array.from(filesList);
    
    const validation = validateImageFiles(filesArray, photos.length);
    if (!validation.valid) {
      setError(validation.error || 'Invalid files');
      return;
    }

    setError(null);

    const newPhotos = filesArray.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
  }, [photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      // Revoke the object url for the removed photo
      const removed = prev.find(p => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  }, []);

  const uploadAndSubmit = async (selectedIds?: ReadonlySet<string>) => {
    const selectedPhotos = selectedIds ? photos.filter((photo) => selectedIds.has(photo.id)) : photos;

    if (selectedPhotos.length === 0) {
      setError('写真を1枚以上選択してください。');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    const uploadedPaths: string[] = [];
    let walkId: string | null = null;
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      // Create walk record
      walkId = await createWalk(user.id, location);

      // Upload each original file. Cropping is only used by the preview grid.
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const result = await uploadWalkPhoto(user.id, walkId, photo.file, i);
        uploadedPaths.push(result.storagePath);
      }

      // Success, redirect
      router.push(`/walk/${walkId}/discover`);
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError('写真のアップロードに失敗しました。もう一度お試しください。');
      
      // Cleanup on failure
      try {
        if (uploadedPaths.length > 0) {
          await deleteWalkPhotos(uploadedPaths);
        }
        if (walkId) {
          await deleteWalk(walkId);
        }
      } catch (cleanupErr) {
        console.error('Failed to cleanup after upload error:', cleanupErr);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return {
    photos,
    location,
    setLocation,
    isUploading,
    error,
    addFiles,
    removePhoto,
    uploadAndSubmit,
    setError,
  };
}
