'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './SavePlaceButton.module.css';

interface Props {
  placeId: string;          // recommended_places.id
  initialSaved: boolean;
  initialSavedPlaceId?: string | null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SavePlaceButton({ placeId, initialSaved, initialSavedPlaceId }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [savedPlaceId, setSavedPlaceId] = useState<string | null>(initialSavedPlaceId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    // Optimistic update
    setSaved(true);

    try {
      const res = await fetch(`/api/places/${placeId}/save`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || '場所を保存できませんでした。');
      setSavedPlaceId(data.savedPlaceId);
    } catch (err: unknown) {
      setSaved(false); // Restore on failure
      setError(getErrorMessage(err, '場所を保存できませんでした。'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async () => {
    if (!savedPlaceId) return;
    setLoading(true);
    setError('');
    // Optimistic update
    setSaved(false);
    const prevId = savedPlaceId;
    setSavedPlaceId(null);

    try {
      const res = await fetch(`/api/saved/${savedPlaceId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || '保存を解除できませんでした。');
      }
    } catch (err: unknown) {
      // Restore on failure
      setSaved(true);
      setSavedPlaceId(prevId);
      setError(getErrorMessage(err, '保存を解除できませんでした。'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        onClick={saved ? handleUnsave : handleSave}
        disabled={loading}
        className={`${styles.button} ${saved ? styles.saved : ''}`}
        aria-label={saved ? '保存を解除' : '場所を保存'}
        aria-pressed={saved}
        data-node-id="18:18"
      >
        <Image src="/figma/recommendations/bookmark.svg" alt="" width={35} height={35} unoptimized />
      </button>
      {error && <span className={styles.error} role="status">{error}</span>}
    </div>
  );
}
