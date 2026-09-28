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
  { background: '#fff8f1', border: '#ffcfae', foreground: '#f05c2e' },
  { background: '#f1faff', border: '#8fd8f4', foreground: '#1679bd' },
  { background: '#f0fcf3', border: '#ace9bb', foreground: '#2cac5a' },
  { background: '#f7f4ff', border: '#cdbefc', foreground: '#7958ee' },
  { background: '#f4f5f6', border: '#dde0e3', foreground: '#686d72' },
  { background: '#effcfc', border: '#9de8eb', foreground: '#168896' },
  { background: '#effaff', border: '#82d9f4', foreground: '#087fb4' },
  { background: '#effcfa', border: '#a6eae2', foreground: '#379796' },
] as const;

const iconRules = [
  { pattern: /食|暮らし|喫茶|カフェ|珈琲|商店|市場|店/, assets: ['asset-06.svg'] },
  { pattern: /港|船/, assets: ['asset-01.svg', 'asset-02.svg'] },
  { pattern: /坂|山|丘/, assets: ['asset-11.svg', 'asset-05.svg', 'asset-08.svg'] },
  { pattern: /神社|寺|鳥居|信仰/, assets: ['asset-04.svg'] },
  { pattern: /街角|提灯|路地/, assets: ['asset-12.svg'] },
  { pattern: /海風|風|質感/, assets: ['asset-09.svg'] },
  { pattern: /海|水辺|浜/, assets: ['asset-10.svg'] },
  { pattern: /緑|自然|植物/, assets: ['asset-13.svg', 'asset-14.svg'] },
] as const;

const globeAssets = ['asset-03.svg', 'asset-07.svg'] as const;

function getTagIconAssets(tag: ThemeTag) {
  const searchableText = `${tag.label} ${tag.category}`;
  return iconRules.find((rule) => rule.pattern.test(searchableText))?.assets ?? globeAssets;
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
          {tags.map((tag, index) => {
            const selected = selectedIds.has(tag.id);
            const unavailable = !selected && selectionLimitReached;
            const tone = tagTones[index % tagTones.length];
            const tagStyle = {
              '--tag-background': tone.background,
              '--tag-border': tone.border,
              '--tag-foreground': tone.foreground,
            } as CSSProperties;
            const iconAssets = getTagIconAssets(tag);

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
                <span className={styles.tagIcon} aria-hidden="true">
                  {iconAssets.map((asset) => (
                    <Image
                      key={asset}
                      src={`/figma/theme-selection-v2/${asset}`}
                      alt=""
                      fill
                      sizes="20px"
                      unoptimized
                    />
                  ))}
                </span>
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
