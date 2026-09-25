'use client';

import React from 'react';
import { RecommendationCard, RecommendationCardData } from './RecommendationCard';
import styles from './RecommendationCarousel.module.css';

interface Props {
  places: RecommendationCardData[];
}

export function RecommendationCarousel({ places }: Props) {
  if (!places || places.length === 0) return null;
  return (
    <div className={styles.carousel} aria-label="おすすめ場所">
      {places.map((place, i) => (
        <RecommendationCard key={place.id ?? i} place={place} />
      ))}
    </div>
  );
}
