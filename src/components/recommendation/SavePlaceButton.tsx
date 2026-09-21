'use client';

import React, { useState } from 'react';

interface Props {
  placeId: string;          // recommended_places.id
  initialSaved: boolean;
  initialSavedPlaceId?: string | null;
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
    } catch (err: any) {
      setSaved(false); // Restore on failure
      setError(err.message);
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
    } catch (err: any) {
      // Restore on failure
      setSaved(true);
      setSavedPlaceId(prevId);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1 }}>
      <button
        onClick={saved ? handleUnsave : handleSave}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          borderRadius: '9999px',
          border: saved ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.15)',
          backgroundColor: saved ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
          color: saved ? '#a5b4fc' : '#c8c7e8',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {saved ? '✓ 保存済み' : '＋ 保存'}
      </button>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}
