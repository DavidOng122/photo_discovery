import React from 'react';
import { RecommendationCard } from '@/components/recommendation/RecommendationCard';
import type { WalkRecommendedPlace } from '@/lib/walks/getWalkDetail';

interface Props {
  places: WalkRecommendedPlace[];
}

export function WalkRecommendations({ places }: Props) {
  if (places.length === 0) return null;
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#c8c7e8' }}>
        次の発見
      </h2>
      {places.map((place) => (
        <RecommendationCard
          key={place.id}
          place={{
            id: place.id,
            name: place.name,
            area: place.area,
            description: place.description,
            imageUrl: place.imageUrl,
            googleMapsQuery: place.googleMapsQuery,
            matchedTags: place.matchedTags,
            isSaved: place.isSaved,
            savedPlaceId: place.savedPlaceId,
          }}
        />
      ))}
    </section>
  );
}
