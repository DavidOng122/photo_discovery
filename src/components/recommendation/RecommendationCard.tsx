'use client';

import React from 'react';
import { RecommendationImage } from './RecommendationImage';
import { MatchedTagList } from './MatchedTagList';
import { SavePlaceButton } from './SavePlaceButton';
import { GoogleMapsButton } from './GoogleMapsButton';

export interface RecommendationCardData {
  id: string;                    // recommended_places.id — required for save action
  name: string;
  area?: string | null;
  description: string;
  imageUrl?: string | null;
  googleMapsQuery: string;
  matchedTags: string[];
  isSaved?: boolean;
  savedPlaceId?: string | null;
}

interface Props {
  place: RecommendationCardData;
}

export function RecommendationCard({ place }: Props) {
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SavePlaceButton
            placeId={place.id}
            initialSaved={place.isSaved ?? false}
            initialSavedPlaceId={place.savedPlaceId}
          />
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
