'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface PhotoSelectionContextValue {
  pendingFiles: File[];
  setPendingFiles: (files: File[]) => void;
  clearPendingFiles: () => void;
}

const PhotoSelectionContext = createContext<PhotoSelectionContextValue | null>(null);

export function PhotoSelectionProvider({ children }: { children: ReactNode }) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const value = useMemo(
    () => ({
      pendingFiles,
      setPendingFiles,
      clearPendingFiles: () => setPendingFiles([]),
    }),
    [pendingFiles],
  );

  return (
    <PhotoSelectionContext.Provider value={value}>
      {children}
    </PhotoSelectionContext.Provider>
  );
}

export function usePendingPhotoSelection() {
  const context = useContext(PhotoSelectionContext);
  if (!context) {
    throw new Error('usePendingPhotoSelection must be used inside PhotoSelectionProvider');
  }
  return context;
}
