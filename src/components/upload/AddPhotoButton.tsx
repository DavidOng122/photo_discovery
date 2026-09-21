import React from 'react';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export function AddPhotoButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'transparent',
        color: 'var(--primary)',
        border: '1px solid var(--primary)',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      写真を追加
    </button>
  );
}
