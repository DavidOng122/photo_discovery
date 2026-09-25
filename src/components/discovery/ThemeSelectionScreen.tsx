'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
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

const tagTones = [
  { background: '#e8f5e2', icon: '#c8e6b8' },
  { background: '#ede8f5', icon: '#d4c8e6' },
  { background: '#e2eef5', icon: '#b8d4e6' },
  { background: '#fdecea', icon: '#f8c8c0' },
  { background: '#fdeef5', icon: '#f5c8df' },
  { background: '#fdf8e2', icon: '#f0e490' },
  { background: '#ebebeb', icon: '#d0d0d0' },
  { background: '#f5ede2', icon: '#e6d0b8' },
  { background: '#f0f0ff', icon: '#d8d8f8' },
  { background: '#e2f0f5', icon: '#b8d8e8' },
] as const;

const iconRules = [
  { pattern: /住宅|建築|家/, icon: '🏠' },
  { pattern: /英語|本|文学|歴史/, icon: '📖' },
  { pattern: /基地|異国/, icon: '✈️' },
  { pattern: /港|船/, icon: '🚢' },
  { pattern: /神社|寺|鳥居/, icon: '⛩️' },
  { pattern: /街角|提灯|路地/, icon: '🏮' },
  { pattern: /坂|山|丘/, icon: '⛰️' },
  { pattern: /喫茶|カフェ|珈琲/, icon: '☕' },
  { pattern: /商店|市場|店/, icon: '🏪' },
  { pattern: /海|水辺|浜/, icon: '🌊' },
] as const;

function getTagIcon(tag: ThemeTag) {
  const searchableText = `${tag.label} ${tag.category}`;
  return iconRules.find((rule) => rule.pattern.test(searchableText))?.icon ?? '✨';
}

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
    <section className={styles.screen} data-node-id="70:178">
      <header className={styles.header} data-node-id="70:184">
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="前の画面に戻る"
          data-node-id="70:185"
        >
          <Image src="/figma/theme-selection/back.svg" alt="" width={20} height={20} unoptimized />
        </button>

        <span className={styles.headerSpacer} aria-hidden="true" data-node-id="70:188" />

        <button
          type="button"
          className={styles.nextButton}
          onClick={onNext}
          disabled={selectedIds.size === 0 || isSubmitting}
          aria-busy={isSubmitting}
          data-node-id="70:191"
        >
          <span data-node-id="70:192">次へ</span>
          <Image src="/figma/theme-selection/next.svg" alt="" width={14} height={14} unoptimized />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.heading} data-node-id="70:25">
          <h1 data-node-id="70:26">見つかったテーマ</h1>
        </div>
        <p className={styles.description} data-node-id="70:29">写真から、こんなテーマが見つかりました</p>
        <p className={styles.hint} data-node-id="70:32">気になるテーマを1〜3個選んでください</p>

        <div className={styles.tagList} aria-label="見つかったテーマ">
          {tags.map((tag, index) => {
            const selected = selectedIds.has(tag.id);
            const unavailable = !selected && selectionLimitReached;
            const tone = tagTones[index % tagTones.length];
            const tagStyle = {
              '--tag-background': tone.background,
              '--tag-icon-background': tone.icon,
            } as CSSProperties;

            return (
              <button
                key={tag.id}
                type="button"
                className={`${styles.tagButton} ${selected ? styles.selectedTag : ''}`}
                style={tagStyle}
                onClick={() => onToggle(tag.id)}
                disabled={isSubmitting || unavailable}
                aria-pressed={selected}
                title={tag.reason}
              >
                <span className={styles.tagIcon}>{getTagIcon(tag)}</span>
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
