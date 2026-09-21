'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteWalkAction } from '@/actions/walk.actions';

interface Props {
  walkId: string;
}

export function WalkDeleteButton({ walkId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError('');
    startTransition(async () => {
      const result = await deleteWalkAction(walkId);
      if (result.error) {
        setError(result.error);
        setConfirming(false);
      } else {
        router.replace('/');
      }
    });
  };

  if (confirming) {
    return (
      <div
        style={{
          marginTop: '2rem',
          padding: '1.25rem',
          backgroundColor: '#1a1020',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px',
        }}
      >
        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: '#f1f0ff', fontSize: '0.95rem' }}>
          この散歩を削除しますか？
        </p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#9090a8', lineHeight: 1.5 }}>
          写真や発見結果は削除されます。保存した場所は残ります。
        </p>
        {error && <p style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: '0.5rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => { setConfirming(false); setError(''); }}
            disabled={isPending}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '9999px',
              backgroundColor: 'transparent', color: '#c8c7e8',
              border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600,
              fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '9999px',
              backgroundColor: '#dc2626', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '0.875rem',
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? '削除中…' : '削除する'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <button
        onClick={() => setConfirming(true)}
        style={{
          width: '100%', padding: '0.65rem', borderRadius: '9999px',
          backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.4)',
          color: '#f87171', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
        }}
      >
        この散歩を削除
      </button>
    </div>
  );
}
