'use client';

/* eslint-disable @next/next/no-img-element */

import styles from './AnalysisLoadingScreen.module.css';

interface AnalysisLoadingScreenProps {
  photoUrls: string[];
}

function buildCardPhotos(photoUrls: string[]) {
  const firstThree = photoUrls.slice(0, 3);
  const isLoadingPhotos = firstThree.length === 0;

  return {
    center: firstThree[0] ?? null,
    left: firstThree[1] ?? null,
    right: firstThree[2] ?? null,
    showCenter: isLoadingPhotos || firstThree.length >= 1,
    showLeft: isLoadingPhotos || firstThree.length >= 2,
    showRight: isLoadingPhotos || firstThree.length >= 3,
  };
}

export function AnalysisLoadingScreen({ photoUrls }: AnalysisLoadingScreenProps) {
  const cards = buildCardPhotos(photoUrls);

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
          {cards.showLeft && (
            <div className={styles.leftMotion} data-node-id="13:89">
              <PhotoCard photoUrl={cards.left} side="side" nodeId="13:90" imageNodeId="13:91" />
            </div>
          )}

          {cards.showRight && (
            <div className={styles.rightMotion} data-node-id="13:92">
              <PhotoCard photoUrl={cards.right} side="side" nodeId="13:93" imageNodeId="13:94" />
            </div>
          )}

          {cards.showCenter && (
            <div className={styles.centerMotion} data-node-id="13:95">
              <PhotoCard photoUrl={cards.center} side="center" nodeId="13:96" imageNodeId="13:97" />
            </div>
          )}
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
