'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav, isBottomNavHidden } from '../navigation/BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideBottomNav = isBottomNavHidden(pathname);

  return (
    <div
      style={{
        margin: '0 auto',
        maxWidth: '402px',
        minHeight: '100vh',
        position: 'relative',
        backgroundColor: 'var(--background)',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      }}
    >
      <main
        style={{
          paddingBottom: hideBottomNav ? 0 : 'calc(84px + env(safe-area-inset-bottom))',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
