'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { DiscoveryTagSelector } from '@/components/discovery/DiscoveryTagSelector';
import { ConfirmDiscoveryButton } from '@/components/discovery/ConfirmDiscoveryButton';
import { MIN_SELECTED_TAGS, MAX_SELECTED_TAGS } from '@/constants/discovery';

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
  const router = useRouter();
  const [status, setStatus] = useState<'LOADING_STATE' | 'ANALYZING' | 'TAG_SELECTION' | 'ERROR'>('LOADING_STATE');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const analyzeWalk = async () => {
    setStatus('ANALYZING');
    setErrorMessage('');
    try {
      const response = await fetch(`/api/walks/${walkId}/analyze`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || '写真の分析に失敗しました。');
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
        if (!stateRes.ok) throw new Error('Walk not found');
        const { walk, tags } = await stateRes.json();
        
        if (walk.status === 'RECOMMENDING' || walk.status === 'COMPLETED') {
          router.replace(`/walk/${walkId}/recommendations`);
          return;
        }

        if (walk.status === 'DRAFT' || walk.status === 'ANALYZING') {
          await analyzeWalk();
        } else {
          setResult({ walkId, status: walk.status, title: walk.title, tags });
          setStatus('TAG_SELECTION');
        }
      } catch (err) {
        setStatus('ERROR');
        setErrorMessage('状態の取得に失敗しました。');
      }
    };
    checkStateAndAnalyze();
  }, [walkId, router]);

  const handleToggleTag = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < MAX_SELECTED_TAGS) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size < MIN_SELECTED_TAGS || selectedIds.size > MAX_SELECTED_TAGS) return;
    
    setIsConfirming(true);
    setConfirmError('');

    try {
      const response = await fetch(`/api/walks/${walkId}/confirm-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTagIds: Array.from(selectedIds) })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || '選択した発見を保存できませんでした。もう一度お試しください。');
      }

      router.push(`/walk/${walkId}/recommendations`);
    } catch (err: any) {
      setConfirmError(err.message);
      setIsConfirming(false);
    }
  };

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
          <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>{errorMessage}</p>
          <button onClick={analyzeWalk} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer' }}>
            もう一度分析する
          </button>
        </div>
      )}

      {status === 'TAG_SELECTION' && result && (
        <div>
          <DiscoveryHeader title={result.title} />
          
          {confirmError && (
            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {confirmError}
            </div>
          )}

          <DiscoveryTagSelector 
            tags={result.tags} 
            selectedIds={selectedIds} 
            onToggle={handleToggleTag}
            disabled={isConfirming}
          />

          <ConfirmDiscoveryButton
            onClick={handleConfirm}
            isConfirming={isConfirming}
            disabled={selectedIds.size < MIN_SELECTED_TAGS}
          />
        </div>
      )}
    </PageContainer>
  );
}
