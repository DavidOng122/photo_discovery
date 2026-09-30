'use client';

import React from 'react';
import { RecommendationCard, type RecommendationCardPlace } from './RecommendationCard';
import styles from './RecommendationCarousel.module.css';

interface Props {
  places: RecommendationCardPlace[];
}

export function RecommendationCarousel({ places }: Props) {
  if (!places || places.length === 0) return null;
  return (
    <div className={styles.carousel} aria-label="新しい発見の場所" role="region" tabIndex={0}>
      {places.map((place, i) => (
        <RecommendationCard key={`${place.name}-${i}`} place={place} />
      ))}
    </div>
  );
}
