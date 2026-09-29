'use client';

import React, { useCallback, useEffect, useRef, useState, use } from 'react';
import { RecommendationCarousel } from '@/components/recommendation/RecommendationCarousel';
import type { RecommendationCardData } from '@/components/recommendation/RecommendationCard';
import { ThemeRecommendationLoading } from '@/components/recommendation/ThemeRecommendationLoading';
import type { ThemeVisualData } from '@/lib/discovery/themeVisuals';
import styles from './page.module.css';

type PageStatus = 'LOADING' | 'GENERATING' | 'COMPLETED' | 'ERROR';

const POLL_INTERVAL_MS = 1500;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface WalkApiResponse {
  walk: { status: string };
  recommendations?: { places: RecommendationCardData[] };
  tags?: Array<{ label: string; category: string; selected?: boolean }>;
}

interface RecommendApiResponse {
  status?: string;
  code?: string;
  places?: RecommendationCardData[];
  error?: { code?: string; message?: string };
}

export default function RecommendationsPage({ params }: { params: Promise<{ walkId: string }> }) {
  const { walkId } = use(params);

  const [pageStatus, setPageStatus] = useState<PageStatus>('LOADING');
  const [places, setPlaces] = useState<RecommendationCardData[]>([]);
  const [selectedTags, setSelectedTags] = useState<ThemeVisualData[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const hasTriggered = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Reads walk state without triggering AI — used for polling
  const pollWalkState = useCallback(async () => {
    const res = await fetch(`/api/walks/${walkId}`);
    if (!res.ok) throw new Error('Walk not found');
    const { walk, recommendations, tags } = await res.json() as WalkApiResponse;

    // Update selected tags display from server
    const selected = (tags ?? []).filter((tag) => tag.selected);
    if (selected.length > 0) setSelectedTags(selected as ThemeVisualData[]);

    if (walk.status === 'COMPLETED' && recommendations?.places?.length) {
      stopPolling();
      setPlaces(recommendations.places);
      setPageStatus('COMPLETED');
    }
    // If still RECOMMENDING: keep polling
  }, [walkId, stopPolling]);

  const startPolling = useCallback(() => {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(() => {
      pollWalkState().catch((err: unknown) => {
        console.error('Poll error:', err);
      });
    }, POLL_INTERVAL_MS);
  }, [pollWalkState]);

  // Triggers the recommend endpoint — only when walk is RECOMMENDING and no generation is in progress
  const triggerRecommendations = useCallback(async () => {
    setPageStatus('GENERATING');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/walks/${walkId}/recommend`, { method: 'POST' });
      const data = await res.json() as RecommendApiResponse;

      if (res.status === 202 && data.code === 'RECOMMENDATION_IN_PROGRESS') {
        // Generation already claimed by another request — poll until complete
        startPolling();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error?.message ?? 'おすすめ場所を見つけられませんでした。');
      }

      if (data.places && data.places.length > 0) {
        setPlaces(data.places);
        setPageStatus('COMPLETED');
      } else {
        throw new Error('おすすめ場所が見つかりませんでした。');
      }
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'おすすめ場所を見つけられませんでした。'));
      setPageStatus('ERROR');
    }
  }, [walkId, startPolling]);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const init = async () => {
      try {
        // Load cached session tags for loading screen display
        try {
          const cachedTags = sessionStorage.getItem(`walk:${walkId}:selected-tags`);
          if (cachedTags) {
            const parsedTags: unknown = JSON.parse(cachedTags);
            if (Array.isArray(parsedTags)) setSelectedTags(parsedTags as ThemeVisualData[]);
          }
        } catch {
          // sessionStorage not available; server data is used below as fallback
        }

        const res = await fetch(`/api/walks/${walkId}`);
        if (!res.ok) throw new Error('Walk not found');
        const { walk, recommendations, tags } = await res.json() as WalkApiResponse;

        const selected = (tags ?? []).filter((tag) => tag.selected);
        if (selected.length > 0) setSelectedTags(selected as ThemeVisualData[]);

        if (walk.status === 'COMPLETED') {
          if (recommendations?.places?.length) {
            setPlaces(recommendations.places);
            setPageStatus('COMPLETED');
          } else {
            // Completed but no data loaded — re-read directly
            const reloadRes = await fetch(`/api/walks/${walkId}`);
            const reload = await reloadRes.json() as WalkApiResponse;
            if (reload.recommendations?.places?.length) {
              setPlaces(reload.recommendations.places);
              setPageStatus('COMPLETED');
            } else {
              throw new Error('おすすめ場所が見つかりませんでした。');
            }
          }
        } else if (walk.status === 'RECOMMENDING') {
          // POST to /recommend — if already claimed it will return 202 and we'll poll
          await triggerRecommendations();
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
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkId]);

  const handleRetry = () => {
    hasTriggered.current = false;
    triggerRecommendations();
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
