import React from 'react';
import Link from 'next/link';

export function HomeEmptyState() {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>🚶</div>
      <h2 style={{ fontSize: '1.15rem', margin: '0 0 0.75rem', color: '#d0cff0' }}>
        まだ発見がありません。
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
        写真から、次の散歩につながる発見を見つけてみましょう。
      </p>
      <Link
        href="/walk/new"
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          padding: '0.75rem 1.75rem',
          borderRadius: '9999px',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        写真を追加
      </Link>
    </div>
  );
}
