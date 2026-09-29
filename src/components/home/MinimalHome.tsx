'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { PhotoActionSheet } from '@/components/upload/PhotoActionSheet';
import { AnalysisLoadingScreen } from '@/components/discovery/AnalysisLoadingScreen';
import { ThemeSelectionScreen } from '@/components/discovery/ThemeSelectionScreen';
import { ThemeRecommendationLoading } from '@/components/recommendation/ThemeRecommendationLoading';
import styles from './MinimalHome.module.css';

type FlowStep = 'upload' | 'analyzing' | 'perspective-selection' | 'recommending' | 'results';

interface DiscoveryItem {
  id: string;
  phrase: string;
  explanation: string;
}

interface RecommendedPlace {
  name: string;
  area: string | null;
  type: string;
  reason: string;
  matchedFeatures: string[];
  googleMapsUrl: string;
  imageUrl?: string | null;
  googlePlaceId?: string | null;
  formattedAddress?: string | null;
}

export function MinimalHome() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [step, setStep] = useState<FlowStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>([]);
  const [error, setError] = useState<string>('');

  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const previewUrls = useMemo(
    () => selectedFiles.slice(0, 10).map((file) => URL.createObjectURL(file)),
    [selectedFiles]
  );

  const selectedDiscovery = useMemo(
    () => discoveries.find((d) => d.id === selectedId) ?? null,
    [discoveries, selectedId]
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

      const rawList: Array<Record<string, unknown>> =
        Array.isArray(data.discoveries) && data.discoveries.length > 0
          ? data.discoveries
          : Array.isArray(data.features)
            ? data.features
            : [];

      const normalized: DiscoveryItem[] = rawList.map((item, index) => ({
        id: `discovery-${index}`,
        phrase: String(item.phrase ?? item.label ?? '写真の発見'),
        explanation: String(item.explanation ?? item.reason ?? ''),
      }));

      setDiscoveries(normalized);
      setSelectedId(null);
      setStep('perspective-selection');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : '写真の分析に失敗しました。');
      setStep('upload');
    }
  };

  const handleToggleDiscovery = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  };

  const handleRecommend = async () => {
    if (!selectedDiscovery) return;

    setStep('recommending');
    setError('');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery: {
            phrase: selectedDiscovery.phrase,
            explanation: selectedDiscovery.explanation,
          },
          currentCity: 'Tokyo',
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
      setStep('perspective-selection');
    }
  };

  const resetFlow = () => {
    setStep('upload');
    setSelectedFiles([]);
    setDiscoveries([]);
    setSelectedId(null);
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

      {step === 'perspective-selection' && (
        <ThemeSelectionScreen
          tags={discoveries.map((d) => ({
            id: d.id,
            label: d.phrase,
            reason: d.explanation,
          }))}
          selectedId={selectedId}
          onSelect={handleToggleDiscovery}
          onBack={resetFlow}
          onNext={handleRecommend}
          isSubmitting={false}
          error={error}
        />
      )}

      {step === 'recommending' && (
        <ThemeRecommendationLoading tags={[{ label: selectedDiscovery?.phrase ?? '選んだ視点' }]} />
      )}

      {step === 'results' && (
        <section style={{ padding: '2rem 1.25rem', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              {selectedDiscovery && (
                <p style={{ color: '#236887', background: '#e8f4fb', display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                  視点: {selectedDiscovery.phrase}
                </p>
              )}
              <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>おすすめの場所</h1>
            </div>
            <button
              type="button"
              onClick={resetFlow}
              style={{
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                background: '#fff',
                padding: '0.6rem 1.1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              もう一度
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {recommendations.map((place) => (
              <article key={`${place.name}-${place.area ?? 'tokyo'}`} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #ececec', display: 'flex', flexDirection: 'column' }}>
                {place.imageUrl && (
                  <div style={{ height: '180px', backgroundImage: `url(${place.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#111827', marginBottom: '0.25rem' }}>
                    {place.name}
                  </div>
                  {place.area && (
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                      {place.area}
                    </div>
                  )}
                  <p style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.95rem', margin: '0 0 1.25rem', flex: 1 }}>
                    {place.reason}
                  </p>
                  <a
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      textDecoration: 'none',
                      background: '#111827',
                      color: '#fff',
                      borderRadius: '999px',
                      padding: '0.8rem 1rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    Google Mapsで開く
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {error && step !== 'perspective-selection' && step !== 'results' && (
        <div style={{ marginTop: '1rem', color: '#b91c1c', textAlign: 'center' }}>{error}</div>
      )}
    </section>
  );
}

