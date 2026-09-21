import React, { useRef } from 'react';

interface Props {
  onFilesSelected: (files: FileList | null) => void;
  disabled?: boolean;
}

export function CameraInput({ onFilesSelected, disabled }: Props) {
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
        capture="environment"
        onChange={(e) => {
          onFilesSelected(e.target.files);
          e.target.value = ''; // reset to allow selecting the same file again if needed
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
        カメラで撮る
      </button>
    </div>
  );
}
