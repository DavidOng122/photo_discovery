'use client';

import React from 'react';
import Image from 'next/image';
import { GoogleMapsButton } from './GoogleMapsButton';
import styles from './RecommendationCard.module.css';

export interface RecommendationCardPlace {
  name: string;
  area?: string | null;
  reason: string;
  imageUrl?: string | null;
  googleMapsUrl: string;
}

interface Props {
  place: RecommendationCardPlace;
}

export function RecommendationCard({ place }: Props) {
  return (
    <article className={`${styles.card} ${place.imageUrl ? styles.withImage : ''}`} data-node-id="13:103">
      {place.imageUrl && (
        <Image
          className={styles.backgroundImage}
          src={place.imageUrl}
          alt=""
          fill
          sizes="(max-width: 430px) calc(100vw - 52px), 349px"
          unoptimized
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      )}

      <div className={styles.details}>
        <h2>{place.name}</h2>
        <p className={styles.description}>
          {place.reason}
        </p>
        <GoogleMapsButton
          name={place.name}
          href={place.googleMapsUrl}
          area={place.area}
          variant="card"
        />
      </div>
    </article>
  );
}
