'use client';

import Image from 'next/image';
import styles from './ThemeSelectionScreen.module.css';

export interface ThemeTag {
  id: string;
  label: string;
  category?: string;
  reason?: string;
}


interface ThemeSelectionScreenProps {
  tags: ThemeTag[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function ThemeSelectionScreen({
  tags,
  selectedId,
  onSelect,
  onBack,
  onNext,
  isSubmitting,
  error,
}: ThemeSelectionScreenProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="前の画面に戻る"
        >
          <Image src="/figma/theme-selection-v2/asset-00.svg" alt="" width={24} height={24} unoptimized />
        </button>

        <button
          type="button"
          className={styles.nextButton}
          onClick={onNext}
          disabled={!selectedId || isSubmitting}
          aria-busy={isSubmitting}
        >
          <span>次へ</span>
        </button>
      </header>

      <div className={styles.content}>
        <h1 className={styles.heading}>見つかった視点</h1>
        <div className={styles.introduction}>
          <p className={styles.description}>写真から、こんな特徴を見つけました</p>
          <p className={styles.hint}>気になるものを1つ選んでください</p>
        </div>

        <div className={styles.tagList} aria-label="見つかった視点">
          {tags.map((tag) => {
            const isSelected = selectedId === tag.id;

            return (
              <button
                key={tag.id}
                type="button"
                className={`${styles.tagButton} ${isSelected ? styles.selectedTag : ''}`}
                onClick={() => onSelect(tag.id)}
                disabled={isSubmitting}
                aria-pressed={isSelected}
                title={tag.reason}
              >
                <span className={styles.tagLabel}>{tag.label}</span>
              </button>
            );
          })}
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </section>
  );
}
