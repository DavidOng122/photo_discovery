'use client';

import React, { useEffect, useRef, useState, use } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { RecommendationCarousel } from '@/components/recommendation/RecommendationCarousel';
import type { RecommendationCardData } from '@/components/recommendation/RecommendationCard';

type PageStatus = 'LOADING' | 'GENERATING' | 'COMPLETED' | 'ERROR';

export default function RecommendationsPage({ params }: { params: Promise<{ walkId: string }> }) {
  const { walkId } = use(params);

  const [pageStatus, setPageStatus] = useState<PageStatus>('LOADING');
  const [places, setPlaces] = useState<RecommendationCardData[]>([]);
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
    } catch (err: any) {
      setErrorMessage(err.message);
      setPageStatus('ERROR');
    }
  };

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const init = async () => {
      try {
        const res = await fetch(`/api/walks/${walkId}`);
        if (!res.ok) throw new Error('Walk not found');
        const { walk, recommendations } = await res.json();

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
      } catch (err: any) {
        setErrorMessage(err.message || 'エラーが発生しました。');
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
    <PageContainer>
      {pageStatus === 'LOADING' && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p style={{ color: 'var(--muted)' }}>読み込み中…</p>
        </div>
      )}

      {pageStatus === 'GENERATING' && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem' }}>
            次の発見につながる場所を探しています…
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            東京の街を分析しています。少しお待ちください。
          </p>
        </div>
      )}

      {pageStatus === 'ERROR' && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f87171', margin: '0 0 0.75rem' }}>
            おすすめ場所を見つけられませんでした。
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            {errorMessage || 'もう一度お試しください。'}
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            もう一度探す
          </button>
        </div>
      )}

      {pageStatus === 'COMPLETED' && places.length > 0 && (
        <div>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.4rem', margin: '0 0 0.35rem', fontWeight: 700 }}>
              次の発見へ
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
              あなたの発見からつながる東京の場所
            </p>
          </div>

          <RecommendationCarousel places={places} />
        </div>
      )}
    </PageContainer>
  );
}
