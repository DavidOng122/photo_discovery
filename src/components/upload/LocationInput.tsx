import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LocationInput({ value, onChange, disabled }: Props) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        場所（任意）
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="例: 代々木公園"
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          fontSize: '1rem',
          backgroundColor: 'transparent',
          color: 'var(--foreground)'
        }}
      />
    </div>
  );
}
