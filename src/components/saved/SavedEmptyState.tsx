'use client';

import React from 'react';

export function SavedEmptyState() {
  return (
    <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗂</div>
      <p style={{ fontSize: '1rem', margin: 0 }}>保存した場所はまだありません。</p>
      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#4a4a6a' }}>
        街歩きのおすすめ場所を保存するとここに表示されます。
      </p>
    </div>
  );
}
