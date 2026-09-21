'use client';

import React from 'react';

interface Props {
  imageUrl?: string | null;
  name: string;
}

export function RecommendationImage({ imageUrl, name }: Props) {
  if (!imageUrl) {
    return (
      <div
        style={{
          width: '100%',
          height: '180px',
          backgroundColor: '#1e1e2e',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4a4a6a',
          fontSize: '2rem',
        }}
        aria-label={name}
      >
        🗾
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      style={{
        width: '100%',
        height: '180px',
        objectFit: 'cover',
        borderRadius: '12px 12px 0 0',
        display: 'block',
      }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
