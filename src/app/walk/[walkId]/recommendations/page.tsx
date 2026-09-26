'use client';

import React, { useEffect, useRef, useState, use } from 'react';
import { RecommendationCarousel } from '@/components/recommendation/RecommendationCarousel';
import type { RecommendationCardData } from '@/components/recommendation/RecommendationCard';
import { ThemeRecommendationLoading } from '@/components/recommendation/ThemeRecommendationLoading';
import type { ThemeVisualData } from '@/lib/discovery/themeVisuals';
import styles from './page.module.css';

type PageStatus = 'LOADING' | 'GENERATING' | 'COMPLETED' | 'ERROR';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function RecommendationsPage({ params }: { params: Promise<{ walkId: string }> }) {
  const { walkId } = use(params);

  const [pageStatus, setPageStatus] = useState<PageStatus>('LOADING');
  const [places, setPlaces] = useState<RecommendationCardData[]>([]);
  const [selectedTags, setSelectedTags] = useState<ThemeVisualData[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const hasTriggered = useRef(false);

  const loadExistingRecommendations = async () => {
    const res = await fetch(`/api/walks/${walkId}`);
    if (!res.ok) throw new Error('Walk not found');
    const { walk, recommendations } = await res.json();
    if (walk.status !== 'COMPLETED' || !recommendations?.places?.length) {
      throw new Error('No recommendations found');
    }
    setPlaces(recommendations.places);
    setPageStatus('COMPLETED');
  };

  const generateRecommendations = async () => {
    setPageStatus('GENERATING');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/walks/${walkId}/recommend`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'おすすめ場所を見つけられませんでした。');
      setPlaces(data.places);
      setPageStatus('COMPLETED');
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'おすすめ場所を見つけられませんでした。'));
      setPageStatus('ERROR');
    }
  };

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const init = async () => {
      try {
        try {
          const cachedTags = sessionStorage.getItem(`walk:${walkId}:selected-tags`);
          if (cachedTags) {
            const parsedTags: unknown = JSON.parse(cachedTags);
            if (Array.isArray(parsedTags)) setSelectedTags(parsedTags);
          }
        } catch {
          // Selected tags are loaded from the walk response below as a fallback.
        }

        const res = await fetch(`/api/walks/${walkId}`);
        if (!res.ok) throw new Error('Walk not found');
        const { walk, recommendations, tags } = await res.json();
        const selected = (tags ?? []).filter((tag: { selected?: boolean }) => tag.selected);
        if (selected.length > 0) setSelectedTags(selected);

        if (walk.status === 'COMPLETED') {
          if (recommendations?.places?.length) {
            setPlaces(recommendations.places);
            setPageStatus('COMPLETED');
          } else {
            // Completed but no recommendations loaded—try fetching explicitly
            await loadExistingRecommendations();
          }
        } else if (walk.status === 'RECOMMENDING') {
          await generateRecommendations();
        } else {
          setErrorMessage('予期しない状態です。最初からやり直してください。');
          setPageStatus('ERROR');
        }
      } catch (err: unknown) {
        setErrorMessage(getErrorMessage(err, 'エラーが発生しました。'));
        setPageStatus('ERROR');
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkId]);

  const handleRetry = () => {
    hasTriggered.current = false;
    generateRecommendations();
  };

  return (
    <section className={styles.screen} data-node-id="13:102">
      {pageStatus === 'LOADING' && (
        <ThemeRecommendationLoading tags={selectedTags} />
      )}

      {pageStatus === 'GENERATING' && (
        <ThemeRecommendationLoading tags={selectedTags} />
      )}

      {pageStatus === 'ERROR' && (
        <div className={`${styles.status} ${styles.errorState}`}>
          <h2>
            おすすめ場所を見つけられませんでした。
          </h2>
          <p>
            {errorMessage || 'もう一度お試しください。'}
          </p>
          <button
            onClick={handleRetry}
          >
            もう一度探す
          </button>
        </div>
      )}

      {pageStatus === 'COMPLETED' && places.length > 0 && (
        <div className={styles.results}>
          <h1 data-node-id="16:14">新しい発見</h1>
          <RecommendationCarousel places={places} />
        </div>
      )}
    </section>
  );
}
