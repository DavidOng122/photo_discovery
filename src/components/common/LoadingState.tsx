import React from 'react';

interface Props {
  message?: string;
}

export function LoadingState({ message = '読み込み中…' }: Props) {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--muted)' }}>
      <p style={{ fontSize: '1rem' }}>{message}</p>
    </div>
  );
}
