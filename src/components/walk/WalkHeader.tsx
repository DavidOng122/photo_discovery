import React from 'react';
import { formatJapaneseDate } from '@/lib/utils/dates';

interface Props {
  location: string | null;
  createdAt: string;
}

export function WalkHeader({ location, createdAt }: Props) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {location && (
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.85rem', color: '#6b6b90' }}>{location}</p>
      )}
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#4a4a6a' }}>
        {formatJapaneseDate(createdAt)}
      </p>
    </div>
  );
}
