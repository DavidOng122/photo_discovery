'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoActionSheet } from '@/components/upload/PhotoActionSheet';
import { usePendingPhotoSelection } from '@/components/upload/PhotoSelectionContext';
import styles from './MinimalHome.module.css';

export function MinimalHome() {
  const router = useRouter();
  const { setPendingFiles } = usePendingPhotoSelection();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setIsSheetOpen(false);
    router.push('/walk/new');
  };

  return (
    <section className={styles.home} data-node-id="81:98">
      <div className={styles.layout} data-node-id="82:258">
        <div className={styles.hero} data-node-id="82:257">
          <div className={styles.copy} data-node-id="82:228">
            <h1 data-node-id="82:207">
              気になった写真から、
              <br />
              次の発見へ
            </h1>
            <p data-node-id="82:210">
              写真に写った文化・スタイル・雰囲気から、
              <br />
              あなたの街で似た魅力を持つ場所を見つけます。
            </p>
          </div>

          <div className={styles.collage} data-node-id="82:227">
            <Image
              className={styles.collageImage}
              src="/figma/minimal-home/photo-collage.png"
              alt="街歩きで見つけた風景の写真"
              width={1536}
              height={1024}
              priority
              unoptimized
            />
          </div>
        </div>

        {!isSheetOpen && (
          <button
            type="button"
            className={styles.cameraButton}
            onClick={() => setIsSheetOpen(true)}
            aria-label="写真を追加する"
            data-node-id="81:99"
          >
            <Image src="/figma/minimal-home/camera.svg" alt="" width={62} height={62} unoptimized />
          </button>
        )}
      </div>

      {isSheetOpen && (
        <PhotoActionSheet onClose={closeSheet} onFilesSelected={handleFilesSelected} />
      )}
    </section>
  );
}
