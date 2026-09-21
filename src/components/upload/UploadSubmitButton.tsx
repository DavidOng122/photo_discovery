import React from 'react';

interface Props {
  onClick: () => void;
  isUploading: boolean;
  disabled?: boolean;
}

export function UploadSubmitButton({ onClick, isUploading, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isUploading}
      style={{
        width: '100%',
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || isUploading) ? 0.7 : 1,
      }}
    >
      {isUploading ? '写真を準備しています…' : 'この写真から発見する'}
    </button>
  );
}
