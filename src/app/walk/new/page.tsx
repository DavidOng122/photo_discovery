'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { PhotoPreviewGrid } from '@/components/upload/PhotoPreviewGrid';
import { LocationInput } from '@/components/upload/LocationInput';
import { UploadSubmitButton } from '@/components/upload/UploadSubmitButton';
import { PhotoPickerSheet } from '@/components/upload/PhotoPickerSheet';
import { AddPhotoButton } from '@/components/upload/AddPhotoButton';
import { MAX_PHOTOS } from '@/constants/images';
import { usePendingPhotoSelection } from '@/components/upload/PhotoSelectionContext';

export default function NewWalkPage() {
  const {
    photos,
    location,
    setLocation,
    isUploading,
    error,
    addFiles,
    removePhoto,
    uploadAndSubmit
  } = usePhotoUpload();

  const [showPicker, setShowPicker] = useState(false);
  const { pendingFiles, clearPendingFiles } = usePendingPhotoSelection();
  const canAddMore = photos.length < MAX_PHOTOS;

  useEffect(() => {
    if (pendingFiles.length === 0) return;
    addFiles(pendingFiles);
    clearPendingFiles();
  }, [addFiles, clearPendingFiles, pendingFiles]);

  const handleFilesSelected = (files: FileList | null) => {
    addFiles(files);
    setShowPicker(false);
  };

  return (
    <PageContainer>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>新しい発見</h1>
      
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          borderRadius: '8px',
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <PhotoPreviewGrid photos={photos} onRemove={removePhoto} />

      {canAddMore && !showPicker && (
        <AddPhotoButton 
          onClick={() => setShowPicker(true)} 
          disabled={isUploading} 
        />
      )}

      {canAddMore && showPicker && (
        <PhotoPickerSheet 
          onFilesSelected={handleFilesSelected} 
          disabled={isUploading} 
        />
      )}

      {photos.length >= MAX_PHOTOS && (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
          最大10枚まで追加できます。
        </p>
      )}

      <LocationInput 
        value={location} 
        onChange={setLocation} 
        disabled={isUploading} 
      />

      <UploadSubmitButton 
        onClick={uploadAndSubmit} 
        isUploading={isUploading} 
        disabled={photos.length === 0}
      />
    </PageContainer>
  );
}
