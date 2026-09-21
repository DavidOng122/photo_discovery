'use client';

import React, { useState, useTransition } from 'react';
import { updateWalkTitle } from '@/actions/walk.actions';

interface Props {
  walkId: string;
  initialTitle: string;
}

export function WalkTitleEditor({ walkId, initialTitle }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [displayed, setDisplayed] = useState(initialTitle);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError('');
    startTransition(async () => {
      const result = await updateWalkTitle(walkId, draft);
      if (result.error) {
        setError(result.error);
      } else {
        setDisplayed(draft);
        setEditing(false);
      }
    });
  };

  const handleCancel = () => {
    setDraft(displayed);
    setEditing(false);
    setError('');
  };

  if (editing) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={draft}
          maxLength={60}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#1e1e2e',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: '8px',
            padding: '0.65rem 0.75rem',
            color: '#f1f0ff',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: '#6b6b90', margin: '0.3rem 0 0', textAlign: 'right' }}>
          {draft.length}/60
        </p>
        {error && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={handleSave}
            disabled={isPending || draft.trim().length === 0}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '9999px',
              backgroundColor: 'var(--primary)', color: 'white', border: 'none',
              fontWeight: 600, fontSize: '0.85rem', cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '9999px',
              backgroundColor: 'transparent', color: '#c8c7e8',
              border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600,
              fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem' }}>
      <h1 style={{ flex: 1, margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#f1f0ff', lineHeight: 1.3 }}>
        {displayed}
      </h1>
      <button
        onClick={() => setEditing(true)}
        style={{
          flexShrink: 0, background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '9999px', padding: '0.3rem 0.75rem', color: '#8888aa',
          fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.2rem',
        }}
      >
        編集
      </button>
    </div>
  );
}
