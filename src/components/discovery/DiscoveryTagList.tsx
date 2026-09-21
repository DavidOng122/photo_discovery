import React from 'react';
import { DiscoveryTag } from './DiscoveryTag';

interface TagData {
  id: string;
  label: string;
}

interface Props {
  tags: TagData[];
}

export function DiscoveryTagList({ tags }: Props) {
  if (tags.length === 0) return null;
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
      {tags.map((tag) => (
        <DiscoveryTag key={tag.id} label={tag.label} />
      ))}
    </div>
  );
}
