'use client';

import React, { useState } from 'react';
import { RecommendationImage } from '@/components/recommendation/RecommendationImage';
import { MatchedTagList } from '@/components/recommendation/MatchedTagList';
import { GoogleMapsButton } from '@/components/recommendation/GoogleMapsButton';
import type { SavedPlace } from '@/lib/saved/getSavedPlaces';

interface Props {
  place: SavedPlace;
  onUnsaved: (id: string) => void;
}

export function SavedPlaceCard({ place, onUnsaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnsave = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/saved/${place.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || '保存を解除できませんでした。');
      }
      onUnsaved(place.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#16162a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '1.25rem',
      }}
    >
      <RecommendationImage imageUrl={place.imageUrl} name={place.name} />

      <div style={{ padding: '1rem 1rem 1.25rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f1f0ff', lineHeight: 1.3 }}>
            {place.name}
          </h3>
          {place.area && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b6b90' }}>
              {place.area}
            </p>
          )}
        </div>

        <MatchedTagList tags={place.matchedTags} />

        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#b0afc8', lineHeight: 1.6 }}>
          {place.description}
        </p>

        {error && (
          <p style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '0.5rem' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleUnsave}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#c8c7e8',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '…' : '保存解除'}
          </button>
          <GoogleMapsButton
            name={place.name}
            googleMapsQuery={place.googleMapsQuery}
            area={place.area}
          />
        </div>
      </div>
    </div>
  );
}
