'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './PhotoActionSheet.module.css';

interface PhotoActionSheetProps {
  onClose: () => void;
  onFilesSelected: (files: FileList | null) => void;
}

export function PhotoActionSheet({ onClose, onFilesSelected }: PhotoActionSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleChange = (files: FileList | null, input: HTMLInputElement) => {
    onFilesSelected(files);
    input.value = '';
  };

  return (
    <div className={styles.overlay} onClick={onClose} data-testid="photo-sheet-overlay">
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="写真の追加方法"
        onClick={(event) => event.stopPropagation()}
        data-node-id="62:402"
      >
        <div className={styles.handleArea}>
          <div className={styles.handle} />
        </div>

        <div className={styles.actions}>
          <input
            ref={cameraInputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => handleChange(event.target.files, event.target)}
          />
          <button
            type="button"
            className={styles.actionRow}
            onClick={() => cameraInputRef.current?.click()}
          >
            <span className={styles.iconBox}>
              <Image src="/figma/photo-sheet/camera.svg" alt="" width={22} height={22} unoptimized />
            </span>
            <span className={styles.actionCopy}>
              <span className={styles.actionTitle}>写真を撮る</span>
              <span className={styles.actionDescription}>今この瞬間を撮影する</span>
            </span>
            <Image src="/figma/photo-sheet/chevron-right.svg" alt="" width={16} height={16} unoptimized />
          </button>

          <div className={styles.divider} />

          <input
            ref={galleryInputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleChange(event.target.files, event.target)}
          />
          <button
            type="button"
            className={`${styles.actionRow} ${styles.secondActionRow}`}
            onClick={() => galleryInputRef.current?.click()}
          >
            <span className={styles.iconBox}>
              <Image src="/figma/photo-sheet/image.svg" alt="" width={22} height={22} unoptimized />
            </span>
            <span className={styles.actionCopy}>
              <span className={styles.actionTitle}>写真を選ぶ</span>
              <span className={styles.actionDescription}>ライブラリから追加する</span>
            </span>
            <Image src="/figma/photo-sheet/chevron-right.svg" alt="" width={16} height={16} unoptimized />
          </button>
        </div>

        <button type="button" className={styles.cancelButton} onClick={onClose}>
          キャンセル
        </button>
      </section>
    </div>
  );
}
