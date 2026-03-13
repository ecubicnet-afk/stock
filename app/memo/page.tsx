import type { Metadata } from 'next';
import { MemoPage } from '@/src/components/pages/MemoPage';

export const metadata: Metadata = {
  title: 'メモ',
  description: '市場メモ・経済イベント管理',
};

export default function Page() {
  return <MemoPage />;
}
