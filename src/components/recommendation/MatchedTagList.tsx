'use client';

import React from 'react';

interface Props {
  tags: string[];
  variant?: 'default' | 'card';
}

export function MatchedTagList({ tags, variant = 'default' }: Props) {
  if (!tags || tags.length === 0) return null;
  if (variant === 'card') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', minHeight: '16px' }}>
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} style={{ color: '#000', fontSize: '13px', lineHeight: '16px', whiteSpace: 'nowrap' }}>
            #{tag}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            borderRadius: '9999px',
            padding: '0.2rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
