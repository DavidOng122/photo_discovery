import React from 'react';

interface Props {
  url: string;
  onRemove: () => void;
}

export function PhotoPreviewItem({ url, onRemove }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
      <img
        src={url}
        alt="Preview"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '8px',
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
