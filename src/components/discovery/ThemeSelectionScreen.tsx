'use client';

import Image from 'next/image';
import styles from './ThemeSelectionScreen.module.css';

export interface ThemeTag {
  id: string;
  label: string;
  category: string;
  reason: string;
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

const LENS_MAP: Record<string, string> = {
  space: '空間',
  culture: '文化',
  nature: '自然',
};

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
          <span>この視点から次の場所を探す</span>
        </button>
      </header>

      <div className={styles.content}>
        <h1 className={styles.heading}>写真から見つけた、{tags.length}つの視点</h1>
        <div className={styles.introduction}>
          <p className={styles.description}>写真から、こんな視点が見つかりました</p>
          <p className={styles.hint}>気になるものを1つ選んでください</p>
        </div>

        <div className={styles.discoveryList}>
          {tags.map((tag) => {
            const isSelected = selectedId === tag.id;
            
            return (
              <div key={tag.id} className={`${styles.discoveryItem} ${isSelected ? styles.selected : ''}`}>
                <button
                  type="button"
                  className={styles.discoveryButton}
                  onClick={() => onSelect(tag.id)}
                  disabled={isSubmitting}
                  aria-pressed={isSelected}
                >
                  <span className={styles.discoveryLens}>{LENS_MAP[tag.category] || tag.category}</span>
                  <span className={styles.discoveryLabel}>{tag.label}</span>
                </button>
                {isSelected && (
                  <div className={styles.discoveryExplanation}>
                    <p>{tag.reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </section>
  );
}
