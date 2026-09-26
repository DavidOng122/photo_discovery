'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisLoadingScreen } from '@/components/discovery/AnalysisLoadingScreen';
import { usePendingPhotoSelection } from '@/components/upload/PhotoSelectionContext';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import styles from './page.module.css';

export default function NewWalkPage() {
  const router = useRouter();
  const { pendingFiles, clearPendingFiles } = usePendingPhotoSelection();
  const { error, uploadFilesAndSubmit } = usePhotoUpload();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const uploadStarted = useRef(false);
  const selectedFiles = useRef<File[]>([]);

  useEffect(() => {
    if (uploadStarted.current) return;

    if (pendingFiles.length === 0) {
      router.replace('/');
      return;
    }

    uploadStarted.current = true;
    selectedFiles.current = [...pendingFiles];
    const urls = selectedFiles.current.slice(0, 3).map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    clearPendingFiles();
    void uploadFilesAndSubmit(selectedFiles.current);

  }, [clearPendingFiles, pendingFiles, router, uploadFilesAndSubmit]);

  const retryUpload = () => {
    if (selectedFiles.current.length > 0) {
      void uploadFilesAndSubmit(selectedFiles.current);
    }
  };

  return (
    <div className={styles.directFlow}>
      <AnalysisLoadingScreen photoUrls={previewUrls} />

      {error && (
        <div className={styles.uploadError} role="alert">
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button type="button" onClick={() => router.replace('/')}>戻る</button>
            <button type="button" onClick={retryUpload}>もう一度試す</button>
          </div>
        </div>
      )}
    </div>
  );
}
