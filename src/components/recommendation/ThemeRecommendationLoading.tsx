import styles from './ThemeRecommendationLoading.module.css';

interface ThemeLabel {
  label: string;
}

interface Props {
  tags: ThemeLabel[];
}

const fallbackTags: ThemeLabel[] = [
  { label: '選んだテーマ' },
];

export function ThemeRecommendationLoading({ tags }: Props) {
  const visibleTags = (tags.length > 0 ? tags : fallbackTags).slice(0, 3);

  return (
    <section className={styles.screen} aria-live="polite" aria-busy="true">
      <div className={styles.content}>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.ripple} />
          <div className={styles.rippleDelayed} />
          <div className={styles.themeStack}>
            {visibleTags.map((tag, index) => (
              <div key={`${tag.label}-${index}`} className={styles.themeTag}>
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressLine} />
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
      </div>
    </section>
  );
}
