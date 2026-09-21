'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  imageUrl: string | null;
  title: string;
  location: string | null;
  selectedTags: string[];
  createdAt: string;
  walkId: string;
  formattedDate: string;
}

export function WalkCard({ imageUrl, title, location, selectedTags, formattedDate, walkId }: Props) {
  return (
    <Link href={`/walk/${walkId}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
      <div
        style={{
          backgroundColor: '#16162a',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Cover image */}
        <div style={{ width: '100%', height: '200px', backgroundColor: '#1e1e2e', overflow: 'hidden' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#2d2d4a' }}>
              🗾
            </div>
          )}
        </div>

        <div style={{ padding: '1rem' }}>
          <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700, color: '#f1f0ff', lineHeight: 1.3 }}>
            {title}
          </h2>

          {location && (
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', color: '#6b6b90' }}>
              {location}
            </p>
          )}

          {selectedTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: 'rgba(99,102,241,0.15)',
                    color: '#a5b4fc',
                    borderRadius: '9999px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#4a4a6a' }}>{formattedDate}</p>
        </div>
      </div>
    </Link>
  );
}
