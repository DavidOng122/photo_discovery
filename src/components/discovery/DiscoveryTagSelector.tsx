'use client';

import React, { useState } from 'react';
import { DiscoveryTag } from './DiscoveryTag';

interface TagData {
  id: string;
  label: string;
  category: string;
  reason: string;
}

interface Props {
  tags: TagData[];
}

export function DiscoveryTagSelector({ tags }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleTag = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < 3) {
          next.add(id);
        }
      }
      return next;
    });
  };

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
            onClick={() => toggleTag(tag.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <DiscoveryTag label={tag.label} selected={selectedIds.has(tag.id)} />
          </button>
        ))}
      </div>
    </div>
  );
}
