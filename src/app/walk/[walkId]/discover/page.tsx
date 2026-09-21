'use client';

import React, { useEffect, useState, use } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { DiscoveryTagSelector } from '@/components/discovery/DiscoveryTagSelector';

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

export default function DiscoverPage({ params }: { params: Promise<{ walkId: string }> }) {
  const { walkId } = use(params);
  const [status, setStatus] = useState<'LOADING_STATE' | 'ANALYZING' | 'TAG_SELECTION' | 'ERROR'>('LOADING_STATE');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const analyzeWalk = async () => {
    setStatus('ANALYZING');
    setErrorMessage('');
    try {
      const response = await fetch(`/api/walks/${walkId}/analyze`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || '写真の分析に失敗しました。');
      }
      
      setResult(data);
      setStatus('TAG_SELECTION');
    } catch (err: any) {
      console.error(err);
      setStatus('ERROR');
      setErrorMessage(err.message || '写真の分析に失敗しました。もう一度お試しください。');
    }
  };

  useEffect(() => {
    const checkStateAndAnalyze = async () => {
      try {
        const stateRes = await fetch(`/api/walks/${walkId}`);
        if (!stateRes.ok) {
          throw new Error('Walk not found');
        }
        const { walk, tags } = await stateRes.json();
        
        if (walk.status === 'DRAFT' || walk.status === 'ANALYZING') {
          // If DRAFT, start analysis. If ANALYZING, maybe retry or wait, but for now we'll just start analysis
          // since there's no polling mechanism built yet.
          await analyzeWalk();
        } else {
          setResult({
            walkId,
            status: walk.status,
            title: walk.title,
            tags,
          });
          setStatus('TAG_SELECTION');
        }
      } catch (err) {
        setStatus('ERROR');
        setErrorMessage('状態の取得に失敗しました。');
      }
    };
    checkStateAndAnalyze();
  }, [walkId]);

  return (
    <PageContainer>
      {(status === 'LOADING_STATE' || status === 'ANALYZING') && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>写真から発見を探しています…</h2>
          <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>
            街の中で繰り返し現れる特徴を見ています…
          </p>
        </div>
      )}

      {status === 'ERROR' && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#b91c1c' }}>写真の分析に失敗しました。</h2>
          <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>
            {errorMessage}
          </p>
          <button
            onClick={analyzeWalk}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            もう一度分析する
          </button>
        </div>
      )}

      {status === 'TAG_SELECTION' && result && (
        <div>
          <DiscoveryHeader title={result.title} />
          <DiscoveryTagSelector tags={result.tags} />
        </div>
      )}
    </PageContainer>
  );
}
