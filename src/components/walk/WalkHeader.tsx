import React from 'react';
import { formatJapaneseDate } from '@/lib/utils/dates';

interface Props {
  title: string;
  location: string | null;
  createdAt: string;
}

export function WalkHeader({ title, location, createdAt }: Props) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.4rem', fontWeight: 700, color: '#f1f0ff', lineHeight: 1.3 }}>
        {title}
      </h1>
      {location && (
        <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#6b6b90' }}>{location}</p>
      )}
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#4a4a6a' }}>
        {formatJapaneseDate(createdAt)}
      </p>
    </div>
  );
}
