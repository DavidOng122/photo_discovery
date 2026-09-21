'use client';

import React, { useState } from 'react';
import { SavedPlaceCard } from './SavedPlaceCard';
import { SavedEmptyState } from './SavedEmptyState';
import type { SavedPlace } from '@/lib/saved/getSavedPlaces';

interface Props {
  initialPlaces: SavedPlace[];
}

export function SavedPlaceList({ initialPlaces }: Props) {
  const [places, setPlaces] = useState<SavedPlace[]>(initialPlaces);

  const handleUnsaved = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  if (places.length === 0) {
    return <SavedEmptyState />;
  }

  return (
    <div>
      {places.map((place) => (
        <SavedPlaceCard key={place.id} place={place} onUnsaved={handleUnsaved} />
      ))}
    </div>
  );
}
