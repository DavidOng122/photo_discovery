'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { BottomNavItem } from './BottomNavItem';
import { PhotoActionSheet } from '../upload/PhotoActionSheet';
import { usePendingPhotoSelection } from '../upload/PhotoSelectionContext';
import styles from './BottomNav.module.css';

export function isBottomNavHidden(pathname: string) {
  return pathname === '/walk/new' || /^\/walk\/[^/]+\/discover(?:\/|$)/.test(pathname);
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setPendingFiles } = usePendingPhotoSelection();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  if (isBottomNavHidden(pathname)) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setIsSheetOpen(false);
    router.push('/walk/new');
  };

  return (
    <>
      {!isSheetOpen && (
        <nav className={styles.nav} aria-label="Primary navigation" data-node-id="60:225">
          <div className={styles.items}>
            <BottomNavItem
              href="/"
              label="Home"
              iconSrc="/figma/home.svg"
              iconWidth={21.019}
              iconHeight={19.629}
              isActive={pathname === '/'}
            />
            <BottomNavItem
              href="/saved"
              label="Saved"
              iconSrc="/figma/saved.svg"
              iconWidth={15}
              iconHeight={18.002}
              isActive={pathname === '/saved'}
            />
          </div>

          <button
            type="button"
            className={styles.cameraAction}
            aria-label="Take or choose a photo"
            onClick={() => setIsSheetOpen(true)}
            data-node-id="10:30"
          >
            <Image src="/figma/camera-action.svg" alt="" width={62} height={62} unoptimized />
          </button>
        </nav>
      )}

      {isSheetOpen && (
        <PhotoActionSheet onClose={closeSheet} onFilesSelected={handleFilesSelected} />
      )}
    </>
  );
}
