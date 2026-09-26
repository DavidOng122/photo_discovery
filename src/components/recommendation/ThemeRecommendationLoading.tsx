import { getThemeIcon, type ThemeVisualData } from '@/lib/discovery/themeVisuals';
import styles from './ThemeRecommendationLoading.module.css';

interface Props {
  tags: ThemeVisualData[];
}

const fallbackTags: ThemeVisualData[] = [
  { label: '選んだテーマ' },
];

export function ThemeRecommendationLoading({ tags }: Props) {
  const visibleTags = (tags.length > 0 ? tags : fallbackTags).slice(0, 3);

  return (
    <section className={styles.screen} aria-live="polite" aria-busy="true">
      <div className={`${styles.orbit} ${styles[`count${visibleTags.length}`]}`} aria-hidden="true">
        <svg className={styles.trails} viewBox="0 0 350 330" fill="none">
          <path className={styles.trailGreen} d="M72 62C64 142 73 182 142 190" />
          <path className={styles.trailBlue} d="M286 123C305 198 284 245 224 267" />
          <path className={styles.trailCoral} d="M91 220C100 277 137 302 190 298" />
        </svg>

        <span className={`${styles.particle} ${styles.particleOne}`} />
        <span className={`${styles.particle} ${styles.particleTwo}`} />
        <span className={`${styles.particle} ${styles.particleThree}`} />
        <span className={`${styles.particle} ${styles.particleFour}`} />

        {visibleTags.map((tag, index) => (
          <div key={`${tag.label}-${index}`} className={`${styles.themeTag} ${styles[`tag${index + 1}`]}`}>
            <span className={styles.icon}>{getThemeIcon(tag)}</span>
            <span>{tag.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.copy}>
        <h1>
          選んだ特徴から
          <br />
          次の場所を探しています…
        </h1>
        <p>
          似た雰囲気の場所を見つけています。
          <br />
          少しお待ちください。
        </p>
      </div>
    </section>
  );
}
