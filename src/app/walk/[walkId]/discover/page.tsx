'use client';

import React, { useCallback, useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { AnalysisLoadingScreen } from '@/components/discovery/AnalysisLoadingScreen';
import { ThemeSelectionScreen } from '@/components/discovery/ThemeSelectionScreen';
import { ThemeRecommendationLoading } from '@/components/recommendation/ThemeRecommendationLoading';

interface TagData {
  id: string;
  label: string;
  category: string;
  reason: string;
}

interface AnalysisResult {
  walkId: string;
  status: string;
  title: string;
  tags: TagData[];
}

const POLL_INTERVAL_MS = 1500;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function DiscoverPage({ params }: { params: Promise<{ walkId: string }> }) {
  const { walkId } = use(params);
  const router = useRouter();
  const [uiStatus, setUiStatus] = useState<'LOADING' | 'ANALYZING' | 'TAG_SELECTION' | 'ERROR'>('LOADING');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const hasStarted = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const fetchWalkState = useCallback(async (): Promise<string> => {
    const stateRes = await fetch(`/api/walks/${walkId}`);
    if (!stateRes.ok) throw new Error('Walk not found');
    const { walk, photos, tags } = await stateRes.json() as {
      walk: { status: string; title?: string };
      photos: { url: string }[];
      tags: TagData[];
    };
    setPhotoUrls((photos ?? []).map((photo) => photo.url));

    if (walk.status === 'RECOMMENDING' || walk.status === 'COMPLETED') {
      router.replace(`/walk/${walkId}/recommendations`);
      return walk.status;
    }

    if (walk.status === 'TAG_SELECTION') {
      setResult({ walkId, status: walk.status, title: walk.title ?? '', tags });
      setUiStatus('TAG_SELECTION');
      return walk.status;
    }

    if (walk.status === 'ANALYZING') {
      setUiStatus('ANALYZING');
      return walk.status;
    }

    return walk.status;
  }, [walkId, router]);

  const triggerAnalysis = useCallback(async () => {
    setUiStatus('ANALYZING');
    setErrorMessage('');
    try {
      const response = await fetch(`/api/walks/${walkId}/analyze`, { method: 'POST' });
      const data = await response.json() as {
        status?: string;
        code?: string;
        error?: { message?: string };
        title?: string;
        tags?: TagData[];
      };

      if (response.status === 202 && data.code === 'ANALYSIS_IN_PROGRESS') {
        return 'ANALYZING';
      }

      if (!response.ok) {
        throw new Error(data.error?.message ?? '写真の分析に失敗しました。');
      }

      return 'DONE';
    } catch (err: unknown) {
      console.error(err);
      setUiStatus('ERROR');
      setErrorMessage(getErrorMessage(err, '写真の分析に失敗しました。もう一度お試しください。'));
      return 'ERROR';
    }
  }, [walkId]);

  const startPolling = useCallback(() => {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(() => {
      fetchWalkState().then((status) => {
        if (status !== 'ANALYZING' && status !== 'DRAFT') {
          stopPolling();
        }
      }).catch((err: unknown) => {
        console.error('Poll error:', err);
      });
    }, POLL_INTERVAL_MS);
  }, [fetchWalkState, stopPolling]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const init = async () => {
      try {
        const status = await fetchWalkState();
        if (status === 'DRAFT') {
          const analyzeResult = await triggerAnalysis();
          if (analyzeResult === 'ANALYZING') {
            startPolling();
          } else if (analyzeResult === 'DONE') {
            await fetchWalkState();
          }
        } else if (status === 'ANALYZING') {
          startPolling();
        }
      } catch (err: unknown) {
        setUiStatus('ERROR');
        setErrorMessage(getErrorMessage(err, '状態の取得に失敗しました。'));
      }
    };

    init();

    return () => stopPolling();
  }, [fetchWalkState, triggerAnalysis, startPolling, stopPolling]);

  const startAnalysis = () => {
    hasStarted.current = false;
    setUiStatus('LOADING');
    // will re-trigger the effect logic by manual call
    triggerAnalysis().then((res) => {
      if (res === 'ANALYZING') {
        startPolling();
      } else if (res === 'DONE') {
        fetchWalkState();
      }
    });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleConfirm = async () => {
    if (!selectedId) return;

    setIsConfirming(true);
    setConfirmError('');

    try {
      const response = await fetch(`/api/walks/${walkId}/select-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discoveryId: selectedId }),
      });

      const data = await response.json() as { error?: { code?: string; message?: string }; status?: string };

      if (!response.ok) {
        const code = data.error?.code;
        if (code === 'SELECTION_ALREADY_CONFIRMED') {
          // Another tab/request already confirmed — navigate to recommendations using server state
          router.push(`/walk/${walkId}/recommendations`);
          return;
        }
        throw new Error(data.error?.message ?? '選択した視点を確認できませんでした。');
      }

      router.push(`/walk/${walkId}/recommendations`);
    } catch (err: unknown) {
      setConfirmError(getErrorMessage(err, '選択した視点を確認できませんでした。'));
      setIsConfirming(false);
    }
  };

  return (
    <>
      {(uiStatus === 'LOADING' || uiStatus === 'ANALYZING') && (
        <AnalysisLoadingScreen photoUrls={photoUrls} />
      )}

      {uiStatus === 'TAG_SELECTION' && result && isConfirming && (
        <ThemeRecommendationLoading tags={result.tags.filter((tag) => tag.id === selectedId)} />
      )}

      {uiStatus === 'ERROR' && (
        <PageContainer>
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#b91c1c' }}>写真の分析に失敗しました。</h2>
            <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>{errorMessage}</p>
            <button
              onClick={() => startAnalysis()}
              style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              もう一度分析する
            </button>
          </div>
        </PageContainer>
      )}

      {uiStatus === 'TAG_SELECTION' && result && !isConfirming && (
        <ThemeSelectionScreen
          tags={result.tags}
          selectedId={selectedId}
          onSelect={handleSelect}
          onBack={() => router.back()}
          onNext={handleConfirm}
          isSubmitting={isConfirming}
          error={confirmError}
        />
      )}
    </>
  );
}
