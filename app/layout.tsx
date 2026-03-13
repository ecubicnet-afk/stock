import type { Metadata } from 'next';
import '@/src/index.css';
import { ClientLayout } from '@/src/components/layout/ClientLayout';

export const metadata: Metadata = {
  title: {
    default: '投資ダッシュボード',
    template: '%s | 投資ダッシュボード',
  },
  description: '株式投資ダッシュボード - リアルタイム市場データ、トレード日誌、ポートフォリオ管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
