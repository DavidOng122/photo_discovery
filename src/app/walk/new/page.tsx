'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PhotoActionSheet } from '@/components/upload/PhotoActionSheet';
import { PhotoPreviewGrid } from '@/components/upload/PhotoPreviewGrid';
import { usePendingPhotoSelection } from '@/components/upload/PhotoSelectionContext';
import { MAX_PHOTOS } from '@/constants/images';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import styles from './page.module.css';

export default function NewWalkPage() {
  const router = useRouter();
  const { photos, isUploading, error, addFiles, uploadAndSubmit } = usePhotoUpload();
  const { pendingFiles, clearPendingFiles } = usePendingPhotoSelection();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const knownPhotoIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pendingFiles.length === 0) return;
    addFiles(pendingFiles);
    clearPendingFiles();
  }, [addFiles, clearPendingFiles, pendingFiles]);

  useEffect(() => {
    const currentIds = new Set(photos.map((photo) => photo.id));
    const newIds = photos.filter((photo) => !knownPhotoIds.current.has(photo.id)).map((photo) => photo.id);

    setSelectedIds((previous) => {
      const next = new Set([...previous].filter((id) => currentIds.has(id)));
      newIds.forEach((id) => next.add(id));
      return next;
    });
    knownPhotoIds.current = currentIds;
  }, [photos]);

  const togglePhoto = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleFilesSelected = (files: FileList | null) => {
    addFiles(files);
    setShowPicker(false);
  };

  const selectedCount = selectedIds.size;

  return (
    <div className={styles.page}>
      <header className={styles.header} data-node-id="64:31">
        <button type="button" className={styles.closeButton} onClick={() => router.push('/')} disabled={isUploading} aria-label="閉じる">
          <Image src="/figma/photo-upload/close.svg" alt="" width={18} height={18} unoptimized />
        </button>
        <h1 className={styles.title}>写真を追加</h1>
        <button
          type="button"
          className={styles.nextButton}
          onClick={() => uploadAndSubmit(selectedIds)}
          disabled={isUploading || selectedCount === 0}
          aria-busy={isUploading}
        >
          次へ ({selectedCount})
        </button>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <PhotoPreviewGrid
        photos={photos}
        selectedIds={selectedIds}
        onToggle={togglePhoto}
        onAdd={() => setShowPicker(true)}
        canAddMore={photos.length < MAX_PHOTOS}
        disabled={isUploading}
      />

      {showPicker && <PhotoActionSheet onClose={() => setShowPicker(false)} onFilesSelected={handleFilesSelected} />}
    </div>
  );
}
