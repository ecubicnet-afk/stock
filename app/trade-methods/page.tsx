import type { Metadata } from 'next';
import { TradeMethodsPage } from '@/src/components/pages/TradeMethodsPage';

export const metadata: Metadata = {
  title: 'トレード手法',
  description: 'トレード手法の記録と管理',
};

export default function Page() {
  return <TradeMethodsPage />;
}
