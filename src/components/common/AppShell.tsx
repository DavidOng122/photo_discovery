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
          maxWidth: '402px',
          minHeight: '100vh',
          position: 'relative',
          backgroundColor: 'var(--background)',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
          }}
        >
          {children}
        </main>
      </div>
    </PhotoSelectionProvider>
  );
}
