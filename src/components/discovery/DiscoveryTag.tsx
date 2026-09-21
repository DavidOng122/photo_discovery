import React from 'react';

interface Props {
  label: string;
  selected?: boolean;
}

export function DiscoveryTag({ label, selected }: Props) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.5rem 1rem',
      margin: '0.25rem',
      backgroundColor: selected ? 'var(--primary)' : '#f3f4f6',
      color: selected ? 'white' : 'var(--foreground)',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: selected ? 'bold' : 'normal',
      border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
    }}>
      #{label}
    </span>
  );
}
