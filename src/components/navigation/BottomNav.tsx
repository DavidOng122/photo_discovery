'use client';

import { usePathname } from 'next/navigation';
import { BottomNavItem } from './BottomNavItem';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        height: '60px',
        backgroundColor: 'var(--background)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavItem 
        href="/" 
        label="Home" 
        isActive={pathname === '/'} 
      />
      <BottomNavItem 
        href="/walk/new" 
        label="Camera" 
        isActive={pathname === '/walk/new'} 
      />
      <BottomNavItem 
        href="/saved" 
        label="Saved" 
        isActive={pathname === '/saved'} 
      />
    </nav>
  );
}
