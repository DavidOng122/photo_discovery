'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { PhotoActionSheet } from '@/components/upload/PhotoActionSheet';
import { AnalysisLoadingScreen } from '@/components/discovery/AnalysisLoadingScreen';
import { ThemeSelectionScreen } from '@/components/discovery/ThemeSelectionScreen';
import { ThemeRecommendationLoading } from '@/components/recommendation/ThemeRecommendationLoading';
import { RecommendationResultScreen } from '@/components/recommendation/RecommendationResultScreen';
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

    const selectionStartedAt = performance.now();
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

      console.info('[recommendation_flow_timing]', JSON.stringify({
        selection_to_results_ms: Math.round(performance.now() - selectionStartedAt),
        server_timing: res.headers.get('Server-Timing'),
      }));
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
        <RecommendationResultScreen places={recommendations} onRestart={resetFlow} />
      )}

      {error && step !== 'perspective-selection' && step !== 'results' && (
        <div style={{ marginTop: '1rem', color: '#b91c1c', textAlign: 'center' }}>{error}</div>
      )}
    </section>
  );
}

