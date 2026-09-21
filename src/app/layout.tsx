import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';
import { AnonymousAuthProvider } from '@/components/auth/AnonymousAuthProvider';

export const metadata: Metadata = {
  title: 'Photo Discovery',
  description: '写真から、次の散歩につながる発見を見つける',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AnonymousAuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AnonymousAuthProvider>
      </body>
    </html>
  );
}
