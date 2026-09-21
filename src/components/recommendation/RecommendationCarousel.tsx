'use client';

import React from 'react';
import { RecommendationCard, RecommendationCardData } from './RecommendationCard';

interface Props {
  places: RecommendationCardData[];
}

export function RecommendationCarousel({ places }: Props) {
  if (!places || places.length === 0) return null;
  return (
    <div>
      {places.map((place, i) => (
        <RecommendationCard key={place.id ?? i} place={place} />
      ))}
    </div>
  );
}
