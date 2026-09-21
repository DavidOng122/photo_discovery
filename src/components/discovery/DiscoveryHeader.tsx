import React from 'react';

interface Props {
  title: string;
}

export function DiscoveryHeader({ title }: Props) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>今回の発見</h1>
      <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', color: 'var(--primary)' }}>
        {title}
      </h2>
    </div>
  );
}
