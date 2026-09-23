'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Discovery } from '@/types/discovery';
import { DiscoveryCard } from './DiscoveryCard';
import styles from './DiscoveryHome.module.css';

const ALL_CATEGORIES = 'すべて';

interface DiscoveryHomeProps {
  discoveries: Discovery[];
}

export function DiscoveryHome({ discoveries }: DiscoveryHomeProps) {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(discoveries.map((item) => item.category)))],
    [discoveries],
  );

  const activeCategory = categories.includes(selectedCategory)
    ? selectedCategory
    : ALL_CATEGORIES;

  const visibleDiscoveries = useMemo(
    () => activeCategory === ALL_CATEGORIES
      ? discoveries
      : discoveries.filter((item) => item.category === activeCategory),
    [activeCategory, discoveries],
  );

  const columns = [
    visibleDiscoveries.filter((_, index) => index % 2 === 0),
    visibleDiscoveries.filter((_, index) => index % 2 === 1),
  ];

  return (
    <div className={styles.home} data-node-id="60:11">
      <header className={styles.header}>
        <div className={styles.profile}>
          <Image
            src="/figma/home/profile.png"
            alt="プロフィール"
            width={36}
            height={36}
            unoptimized
          />
        </div>
      </header>

      {discoveries.length > 0 ? (
        <>
          <div className={styles.tabs} role="tablist" aria-label="発見のカテゴリー">
            {categories.map((category) => {
              const isSelected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`${styles.tab} ${isSelected ? styles.activeTab : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <section className={styles.gallery} aria-label="発見一覧">
            {columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className={`${styles.column} ${columnIndex === 1 ? styles.offsetColumn : ''}`}
              >
                {column.map((discovery) => (
                  <DiscoveryCard key={discovery.id} discovery={discovery} />
                ))}
              </div>
            ))}
          </section>
        </>
      ) : (
        <div className={styles.emptyState}>
          <h1>まだ発見がありません</h1>
          <p>写真を追加すると、AIが見つけた発見がここに表示されます。</p>
        </div>
      )}
    </div>
  );
}
