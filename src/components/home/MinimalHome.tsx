'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { PhotoActionSheet } from '@/components/upload/PhotoActionSheet';
import { AnalysisLoadingScreen } from '@/components/discovery/AnalysisLoadingScreen';
import { ThemeSelectionScreen } from '@/components/discovery/ThemeSelectionScreen';
import { ThemeRecommendationLoading } from '@/components/recommendation/ThemeRecommendationLoading';
import styles from './MinimalHome.module.css';

type FlowStep = 'upload' | 'analyzing' | 'feature-selection' | 'recommending' | 'results';

type FeatureItem = {
  id: string;
  label: string;
  type: 'culture' | 'style' | 'atmosphere';
  reason: string;
  category?: string;
};

export function MinimalHome() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [step, setStep] = useState<FlowStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [recommendations, setRecommendations] = useState<Array<{ name: string; area: string | null; reason: string; matchedFeatures: string[]; googleMapsUrl: string; imageUrl?: string | null; googlePlaceId?: string | null; formattedAddress?: string | null; }>>([]);
  const [error, setError] = useState<string>('');

  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const previewUrls = useMemo(
    () => selectedFiles.slice(0, 10).map((file) => URL.createObjectURL(file)),
    [selectedFiles]
  );

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nextFiles = Array.from(files).slice(0, 10);
    setSelectedFiles(nextFiles);
    setIsSheetOpen(false);
    setError('');
    setStep('analyzing');

    try {
      const formData = new FormData();
      nextFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || '写真の分析に失敗しました。');
      }

      const normalized = (data.features ?? []).map((feature: any, index: number) => ({
        id: `${feature.label}-${index}`,
        label: feature.label,
        type: feature.type ?? 'style',
        reason: feature.reason ?? '',
        category: feature.type ?? 'style',
      }));

      setFeatures(normalized);
      setSelectedIds(new Set());
      setStep('feature-selection');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : '写真の分析に失敗しました。');
      setStep('upload');
    }
  };

  const handleToggleFeature = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const handleRecommend = async () => {
    const selected = features.filter((feature) => selectedIds.has(feature.id));
    if (selected.length < 1 || selected.length > 3) return;

    setStep('recommending');
    setError('');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedFeatures: selected.map((feature) => ({
            label: feature.label,
            type: feature.type,
            reason: feature.reason,
          })),
          currentCity: 'Tokyo',
          originalArea: 'Yokosuka',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'おすすめの生成に失敗しました。');
      }

      setRecommendations(data.places ?? []);
      setStep('results');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'おすすめの生成に失敗しました。');
      setStep('feature-selection');
    }
  };

  const resetFlow = () => {
    setStep('upload');
    setSelectedFiles([]);
    setFeatures([]);
    setSelectedIds(new Set());
    setRecommendations([]);
    setError('');
  };

  return (
    <section className={styles.home} data-node-id="81:98">
      {step === 'upload' && (
        <>
          <div className={styles.layout} data-node-id="82:258">
            <div className={styles.hero} data-node-id="82:257">
              <div className={styles.copy} data-node-id="82:228">
                <h1 data-node-id="82:207">
                  気になった写真から、
                  <br />
                  次の発見へ
                </h1>
                <p data-node-id="82:210">
                  写真に写った文化・スタイル・雰囲気から、
                  <br />
                  あなたの街で似た魅力を持つ場所を見つけます。
                </p>
              </div>

              <div className={styles.collage} data-node-id="82:227">
                <Image className={styles.collageImage} src="/figma/minimal-home/photo-collage.png" alt="街歩きで見つけた風景の写真" width={1536} height={1024} priority unoptimized />
              </div>
            </div>

            {!isSheetOpen && (
              <button type="button" className={styles.cameraButton} onClick={() => setIsSheetOpen(true)} aria-label="写真を追加する" data-node-id="81:99">
                <Image src="/figma/minimal-home/camera.svg" alt="" width={62} height={62} unoptimized />
              </button>
            )}
          </div>

          {isSheetOpen && <PhotoActionSheet onClose={closeSheet} onFilesSelected={handleFilesSelected} />}
        </>
      )}

      {step === 'analyzing' && (
        <AnalysisLoadingScreen photoUrls={previewUrls} />
      )}

      {step === 'feature-selection' && (
        <ThemeSelectionScreen
          tags={features.map((feature) => ({
            id: feature.id,
            label: feature.label,
            category: feature.category ?? feature.type,
            reason: feature.reason,
          }))}
          selectedIds={selectedIds}
          onToggle={handleToggleFeature}
          onBack={resetFlow}
          onNext={handleRecommend}
          isSubmitting={false}
          error={error}
        />
      )}

      {step === 'recommending' && (
        <ThemeRecommendationLoading tags={features.filter((feature) => selectedIds.has(feature.id)).map((feature) => ({ label: feature.label, category: feature.type }))} />
      )}

      {step === 'results' && (
        <section style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ color: 'var(--muted)', margin: 0 }}>この特徴を持つ場所を見つけました</p>
              <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem' }}>おすすめの場所</h1>
            </div>
            <button type="button" onClick={resetFlow} style={{ borderRadius: '999px', border: '1px solid #d1d5db', background: '#fff', padding: '0.75rem 1rem', cursor: 'pointer' }}>
              もう一度
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {recommendations.map((place) => (
              <article key={`${place.name}-${place.area ?? 'no-area'}`} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #ececec' }}>
                {place.imageUrl && (
                  <div style={{ height: '180px', backgroundImage: `url(${place.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>{place.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {place.matchedFeatures.map((feature) => (
                      <span key={feature} style={{ background: '#f3f4f6', color: '#111827', borderRadius: '999px', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>#{feature}</span>
                    ))}
                  </div>
                  <p style={{ color: '#374151', lineHeight: 1.7, margin: '0 0 1rem' }}>{place.reason}</p>
                  <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', textDecoration: 'none', background: '#111827', color: '#fff', borderRadius: '999px', padding: '0.75rem 1rem', fontWeight: 600 }}>
                    Google Mapsで開く
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {error && step !== 'feature-selection' && step !== 'results' && (
        <div style={{ marginTop: '1rem', color: '#b91c1c', textAlign: 'center' }}>{error}</div>
      )}
    </section>
  );
}
