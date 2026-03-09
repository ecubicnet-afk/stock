import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ChartPage } from './pages/ChartPage';
import { MemoPage } from './pages/MemoPage';
import { SchedulePage } from './pages/SchedulePage';
import { WatchlistPage } from './pages/WatchlistPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/memo" element={<MemoPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
