'use client';

import { ReactNode } from 'react';
import { PhotoSelectionProvider } from '../upload/PhotoSelectionContext';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <PhotoSelectionProvider>
      <div
        style={{
          margin: '0 auto',
          width: '100%',
          maxWidth: '1440px',
          minHeight: '100dvh',
          position: 'relative',
          backgroundColor: 'var(--background)',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        }}
      >
        <main
          style={{
            minHeight: '100dvh',
          }}
        >
          {children}
        </main>
      </div>
    </PhotoSelectionProvider>
  );
}
