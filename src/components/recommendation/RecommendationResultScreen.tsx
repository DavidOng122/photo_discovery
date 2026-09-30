'use client';

import Link from 'next/link';
import { RecommendationCarousel } from './RecommendationCarousel';
import type { RecommendationCardPlace } from './RecommendationCard';
import styles from './RecommendationResultScreen.module.css';

interface Props {
  places: RecommendationCardPlace[];
  onRestart?: () => void;
}

export function RecommendationResultScreen({ places, onRestart }: Props) {
  return (
    <section className={styles.screen} data-node-id="13:102">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 data-node-id="16:14">新しい発見</h1>
          {onRestart ? (
            <button type="button" className={styles.restart} onClick={onRestart}>
              もう一度試す
            </button>
          ) : (
            <Link className={styles.restart} href="/">
              もう一度試す
            </Link>
          )}
        </header>
        <RecommendationCarousel places={places} />
      </div>
    </section>
  );
}
