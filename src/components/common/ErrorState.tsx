import React from 'react';

interface Props {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message = 'エラーが発生しました。',
  onRetry,
  retryLabel = 'もう一度お試しください',
}: Props) {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <p style={{ color: '#f87171', fontSize: '1rem', marginBottom: '1rem' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.65rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
