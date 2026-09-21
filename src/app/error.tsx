'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>エラーが発生しました</h2>
      <button
        onClick={() => reset()}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        再試行
      </button>
    </div>
  );
}
