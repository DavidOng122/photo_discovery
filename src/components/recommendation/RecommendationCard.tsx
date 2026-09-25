'use client';

import React from 'react';
import Image from 'next/image';
import { MatchedTagList } from './MatchedTagList';
import { SavePlaceButton } from './SavePlaceButton';
import { GoogleMapsButton } from './GoogleMapsButton';
import styles from './RecommendationCard.module.css';

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
    <article className={styles.card} data-node-id="13:103">
      {place.imageUrl && (
        <Image
          className={styles.backgroundImage}
          src={place.imageUrl}
          alt=""
          fill
          sizes="(max-width: 402px) calc(100vw - 38px), 349px"
          unoptimized
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      )}

      <SavePlaceButton
        placeId={place.id}
        initialSaved={place.isSaved ?? false}
        initialSavedPlaceId={place.savedPlaceId}
      />

      <div className={styles.details}>
        <h2>{place.name}</h2>
        <MatchedTagList tags={place.matchedTags} variant="card" />
        <p className={styles.description}>
          {place.description}
        </p>
        <GoogleMapsButton
          name={place.name}
          googleMapsQuery={place.googleMapsQuery}
          area={place.area}
          variant="card"
        />
      </div>
    </article>
  );
}
