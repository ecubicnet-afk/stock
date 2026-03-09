import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ChartPage } from './pages/ChartPage';
import { MemoPage } from './pages/MemoPage';
import { JournalPage } from './pages/JournalPage';

import { PortfolioPage } from './pages/PortfolioPage';
import { StrategyPage } from './pages/StrategyPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/memo" element={<MemoPage />} />
          <Route path="/schedule" element={<Navigate to="/memo" replace />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/watchlist" element={<Navigate to="/memo" replace />} />
          <Route path="/trade-analysis" element={<Navigate to="/journal" replace />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
