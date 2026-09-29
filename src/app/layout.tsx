import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';

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
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

