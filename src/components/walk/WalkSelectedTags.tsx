import React from 'react';

interface Tag {
  id: string;
  label: string;
}

interface Props {
  tags: Tag[];
}

export function WalkSelectedTags({ tags }: Props) {
  if (tags.length === 0) return null;
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#c8c7e8' }}>
        今回の発見
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        {tags.map((tag) => (
          <span
            key={tag.id}
            style={{
              backgroundColor: 'rgba(99,102,241,0.2)',
              color: '#a5b4fc',
              borderRadius: '9999px',
              padding: '0.3rem 0.8rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(99,102,241,0.4)',
            }}
          >
            #{tag.label}
          </span>
        ))}
      </div>
    </section>
  );
}
