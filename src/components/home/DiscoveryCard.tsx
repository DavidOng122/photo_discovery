import Image from 'next/image';
import type { Discovery } from '@/types/discovery';
import styles from './DiscoveryHome.module.css';

const tallCardIds = new Set(['forest-shrine', 'historic-architecture']);

const categoryTone: Record<string, string> = {
  建築: styles.neutralCategory,
  神社: styles.greenCategory,
  食: styles.amberCategory,
  街の文化: styles.blueCategory,
};

interface DiscoveryCardProps {
  discovery: Discovery;
}

export function DiscoveryCard({ discovery }: DiscoveryCardProps) {
  const isTall = tallCardIds.has(discovery.id);

  return (
    <article className={styles.card} data-discovery-id={discovery.id}>
      <div className={`${styles.imageFrame} ${isTall ? styles.tallImageFrame : ''}`}>
        <Image
          src={discovery.image}
          alt={discovery.title}
          fill
          sizes="(max-width: 402px) calc((100vw - 36px) / 2), 183px"
          className={styles.cardImage}
          unoptimized
        />
      </div>
      <div className={styles.cardBody}>
        <h2>{discovery.title}</h2>
        <div className={styles.metadata}>
          <span className={styles.location}>
            <Image src="/figma/home/pin.svg" alt="" width={11} height={13} unoptimized />
            {discovery.location}
          </span>
          <span className={`${styles.category} ${categoryTone[discovery.category] ?? styles.neutralCategory}`}>
            {discovery.category}
          </span>
        </div>
      </div>
    </article>
  );
}
