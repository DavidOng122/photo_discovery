'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BottomNavItem } from './BottomNavItem';
import styles from './BottomNav.module.css';

export function isBottomNavHidden(pathname: string) {
  return pathname === '/walk/new' || /^\/walk\/[^/]+\/discover(?:\/|$)/.test(pathname);
}

export function BottomNav() {
  const pathname = usePathname();

  if (isBottomNavHidden(pathname)) return null;

  return (
    <nav className={styles.nav} aria-label="Primary navigation" data-node-id="60:225">
      <div className={styles.items}>
        <BottomNavItem
          href="/"
          label="Home"
          iconSrc="/figma/home.svg"
          iconWidth={21.019}
          iconHeight={19.629}
          isActive={pathname === '/'}
        />
        <BottomNavItem
          href="/saved"
          label="Saved"
          iconSrc="/figma/saved.svg"
          iconWidth={15}
          iconHeight={18.002}
          isActive={pathname === '/saved'}
        />
      </div>

      <Link
        href="/walk/new"
        className={styles.cameraAction}
        aria-label="Take or choose a photo"
        aria-current={pathname === '/walk/new' ? 'page' : undefined}
        data-node-id="10:30"
      >
        <Image src="/figma/camera-action.svg" alt="" width={62} height={62} unoptimized />
      </Link>
    </nav>
  );
}
