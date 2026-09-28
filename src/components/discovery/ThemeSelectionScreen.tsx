'use client';

import Image from 'next/image';
import styles from './ThemeSelectionScreen.module.css';

interface ThemeTag {
  id: string;
  label: string;
  category: string;
  reason: string;
}

interface ThemeSelectionScreenProps {
  tags: ThemeTag[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  error?: string;
}

const MAX_SELECTIONS = 3;

export function ThemeSelectionScreen({
  tags,
  selectedIds,
  onToggle,
  onBack,
  onNext,
  isSubmitting,
  error,
}: ThemeSelectionScreenProps) {
  const selectionLimitReached = selectedIds.size >= MAX_SELECTIONS;

  return (
    <section className={styles.screen} data-node-id="98:11">
      <header className={styles.header} data-node-id="98:12">
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="前の画面に戻る"
          data-node-id="98:13"
        >
          <Image src="/figma/theme-selection-v2/asset-00.svg" alt="" width={24} height={24} unoptimized />
        </button>

        <button
          type="button"
          className={styles.nextButton}
          onClick={onNext}
          disabled={selectedIds.size === 0 || isSubmitting}
          aria-busy={isSubmitting}
          data-node-id="98:16"
        >
          <span data-node-id="98:17">次へ</span>
        </button>
      </header>

      <div className={styles.content}>
        <h1 className={styles.heading} data-node-id="98:22">見つかった視点</h1>
        <div className={styles.introduction} data-node-id="98:24">
          <p className={styles.description} data-node-id="98:25">写真から、こんな視点が見つかりました</p>
          <p className={styles.hint}>気になるものを1〜3個選んでください</p>
        </div>

        <div className={styles.tagList} aria-label="見つかった視点" data-node-id="98:28">
          {tags.map((tag) => {
            const selected = selectedIds.has(tag.id);
            const unavailable = !selected && selectionLimitReached;

            return (
              <button
                key={tag.id}
                type="button"
                className={`${styles.tagButton} ${selected ? styles.selectedTag : ''}`}
                onClick={() => onToggle(tag.id)}
                disabled={isSubmitting || unavailable}
                aria-pressed={selected}
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
