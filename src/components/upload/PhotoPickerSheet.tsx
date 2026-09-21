import React from 'react';
import { CameraInput } from './CameraInput';
import { GalleryInput } from './GalleryInput';

interface Props {
  onFilesSelected: (files: FileList | null) => void;
  disabled?: boolean;
}

export function PhotoPickerSheet({ onFilesSelected, disabled }: Props) {
  return (
    <div style={{ 
      marginTop: '1rem', 
      padding: '1rem', 
      backgroundColor: 'var(--background)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem' 
    }}>
      <p style={{ margin: 0, fontWeight: 'bold', textAlign: 'center' }}>写真の追加方法を選択</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <CameraInput onFilesSelected={onFilesSelected} disabled={disabled} />
        </div>
        <div style={{ flex: 1 }}>
          <GalleryInput onFilesSelected={onFilesSelected} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
