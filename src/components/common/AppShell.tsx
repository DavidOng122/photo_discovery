import { ReactNode } from 'react';
import { BottomNav } from '../navigation/BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        margin: '0 auto',
        maxWidth: '600px',
        minHeight: '100vh',
        position: 'relative',
        backgroundColor: 'var(--background)',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      }}
    >
      <main
        style={{
          paddingBottom: 'calc(60px + env(safe-area-inset-bottom))', 
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
