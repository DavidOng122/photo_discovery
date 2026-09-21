'use client';

import React from 'react';
import { DiscoveryTag } from './DiscoveryTag';

interface TagData {
  id: string;
  label: string;
  category: string;
  reason: string;
}

interface Props {
  tags: TagData[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function DiscoveryTagSelector({ tags, selectedIds, onToggle, disabled }: Props) {
  if (tags.length === 0) return null;

  return (
    <div>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
        気になった発見を最大3つ選んでください。
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <DiscoveryTag label={tag.label} selected={selectedIds.has(tag.id)} />
          </button>
        ))}
      </div>
    </div>
  );
}
