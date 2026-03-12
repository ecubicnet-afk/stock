import type { Metadata } from 'next';
import '@/src/index.css';
import { ClientLayout } from '@/src/components/layout/ClientLayout';

export const metadata: Metadata = {
  title: '投資ダッシュボード',
  description: '株式投資ダッシュボード',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
