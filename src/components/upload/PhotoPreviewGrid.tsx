import React from 'react';
import { PhotoPreviewItem } from './PhotoPreviewItem';
import { PreviewFile } from '@/hooks/usePhotoUpload';

interface Props {
  photos: PreviewFile[];
  onRemove: (id: string) => void;
}

export function PhotoPreviewGrid({ photos, onRemove }: Props) {
  if (photos.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginTop: '1rem'
    }}>
      {photos.map((photo) => (
        <PhotoPreviewItem 
          key={photo.id} 
          url={photo.previewUrl} 
          onRemove={() => onRemove(photo.id)} 
        />
      ))}
    </div>
  );
}
