import React, { useRef } from 'react';

interface Props {
  onFilesSelected: (files: FileList | null) => void;
  disabled?: boolean;
}

export function GalleryInput({ onFilesSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          onFilesSelected(e.target.files);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
      <button 
        type="button" 
        onClick={handleClick} 
        disabled={disabled}
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          color: 'var(--foreground)'
        }}
      >
        写真を選択
      </button>
    </div>
  );
}
