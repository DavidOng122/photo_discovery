import Image from 'next/image';
import Link from 'next/link';
import styles from './BottomNav.module.css';

interface BottomNavItemProps {
  href: string;
  label: string;
  iconSrc: string;
  iconWidth: number;
  iconHeight: number;
  isActive: boolean;
}

export function BottomNavItem({
  href,
  label,
  iconSrc,
  iconWidth,
  iconHeight,
  isActive,
}: BottomNavItemProps) {
  return (
    <Link
      href={href}
      className={styles.item}
      aria-current={isActive ? 'page' : undefined}
    >
      <Image
        src={iconSrc}
        alt=""
        width={iconWidth}
        height={iconHeight}
        unoptimized
      />
      <span>{label}</span>
    </Link>
  );
}
