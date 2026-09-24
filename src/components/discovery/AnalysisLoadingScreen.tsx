'use client';

/* eslint-disable @next/next/no-img-element */

import styles from './AnalysisLoadingScreen.module.css';

interface AnalysisLoadingScreenProps {
  photoUrls: string[];
}

function buildCardPhotos(photoUrls: string[]) {
  if (photoUrls.length === 0) return [null, null, null];

  const firstThree = photoUrls.slice(0, 3);
  return [firstThree[1] ?? firstThree[0], firstThree[2] ?? firstThree[0], firstThree[0]];
}

export function AnalysisLoadingScreen({ photoUrls }: AnalysisLoadingScreenProps) {
  const [leftPhoto, rightPhoto, centerPhoto] = buildCardPhotos(photoUrls);

  return (
    <section className={styles.screen} data-node-id="13:76" aria-live="polite" aria-busy="true">
      <div className={styles.content} data-node-id="13:81">
        <div className={styles.heading} data-node-id="13:83">
          <h1 data-node-id="13:84">
            <span>写真から</span>
            <span>テーマを見つけています</span>
          </h1>
        </div>

        <div className={styles.progressTrack} data-node-id="13:86" aria-hidden="true">
          <div className={styles.progressLine} data-node-id="13:87" />
        </div>

        <div className={styles.photoDeck} data-node-id="13:88" aria-hidden="true">
          <div className={styles.leftMotion} data-node-id="13:89">
            <PhotoCard photoUrl={leftPhoto} side="side" nodeId="13:90" imageNodeId="13:91" />
          </div>

          <div className={styles.rightMotion} data-node-id="13:92">
            <PhotoCard photoUrl={rightPhoto} side="side" nodeId="13:93" imageNodeId="13:94" />
          </div>

          <div className={styles.centerMotion} data-node-id="13:95">
            <PhotoCard photoUrl={centerPhoto} side="center" nodeId="13:96" imageNodeId="13:97" />
          </div>
        </div>

        <p className={styles.waitingText} data-node-id="13:99">少しお待ちください</p>
      </div>
    </section>
  );
}

function PhotoCard({
  photoUrl,
  side,
  nodeId,
  imageNodeId,
}: {
  photoUrl: string | null;
  side: 'side' | 'center';
  nodeId: string;
  imageNodeId: string;
}) {
  return (
    <div className={side === 'center' ? styles.centerCard : styles.sideCard}>
      <div className={side === 'center' ? styles.centerPhoto : styles.sidePhoto} data-node-id={nodeId}>
        {photoUrl && <img src={photoUrl} alt="" data-node-id={imageNodeId} />}
      </div>
    </div>
  );
}
