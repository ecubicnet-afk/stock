import { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useClock } from '../../hooks/useClock';
import { useSettings } from '../../hooks/useSettings';
import { useTrades } from '../../hooks/useTrades';
import { loadSnapshots, type DailySnapshot } from '../../services/firebase';
import { SettingsModal } from '../settings/SettingsModal';
import { CloudSyncDropdown } from './CloudSyncDropdown';
import { NAV_ITEMS } from '../../utils/constants';

interface HeaderProps {
  onMenuToggle: () => void;
}

function formatJPY(value: number): string {
  if (Math.abs(value) >= 1e8) return `${(value / 1e8).toFixed(2)}億`;
  if (Math.abs(value) >= 1e4) return `${(value / 1e4).toFixed(1)}万`;
  return value.toLocaleString();
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { time, date, marketStatuses } = useClock();
  const { settings } = useSettings();
  const { trades } = useTrades();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);

  useEffect(() => {
    loadSnapshots(settings).then(setSnapshots).catch(() => {});
  }, [settings]);

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const prevSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const dailyChange = latestSnapshot && prevSnapshot ? latestSnapshot.totalAsset - prevSnapshot.totalAsset : null;

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTrades = trades.filter((t) => t.date.startsWith(monthPrefix) && t.side === 'sell' && t.pnl !== undefined);
    const totalPnl = monthTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const wins = monthTrades.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
    return { totalPnl, winRate, tradeCount: monthTrades.length };
  }, [trades]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-secondary/80 backdrop-blur-md border-b border-border">
        <div className="h-16 flex items-center px-4 gap-4">
          {/* ハンバーガーメニュー（モバイル） */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* サイドパネルトグル（デスクトップ） */}
          <button
            onClick={onMenuToggle}
            className="hidden md:block p-2 text-text-secondary hover:text-text-primary transition-colors"
            title="パネル開閉"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18v18H3V3zm6 0v18" />
            </svg>
          </button>

          {/* サイトタイトル */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-accent-cyan rounded-full" />
            <h1 className="text-lg font-bold text-text-primary hidden sm:block">
              Investment Dashboard
            </h1>
            <h1 className="text-lg font-bold text-text-primary sm:hidden">
              InvDash
            </h1>
          </div>

          {/* 時計 */}
          <div className="ml-auto flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-xs text-text-secondary">{date}</div>
              <div className="font-mono text-lg font-semibold text-accent-cyan">{time}</div>
            </div>

            {/* 市場開閉インジケーター */}
            <div className="hidden lg:flex items-center gap-3">
              {marketStatuses.map((status) => (
                <div
                  key={status.market}
                  className="flex items-center gap-1.5 text-xs"
                  title={status.nextEvent}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status.isOpen ? 'bg-up animate-pulse' : 'bg-down'
                    }`}
                  />
                  <span className="text-text-secondary">{status.market}</span>
                </div>
              ))}
            </div>

            {/* クラウド同期 */}
            <CloudSyncDropdown />

            {/* 設定ボタン */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="設定"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 資産概要 & 今月の損益バー */}
        <div className="hidden md:flex items-center gap-6 px-4 py-1.5 border-t border-border/50 text-xs">
          {/* 資産概要 */}
          {latestSnapshot ? (
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">総資産</span>
              <span className="font-mono font-semibold text-text-primary">¥{formatJPY(latestSnapshot.totalAsset)}</span>
              <span className="text-text-secondary">含み損益</span>
              <span className={`font-mono ${latestSnapshot.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {latestSnapshot.totalProfit >= 0 ? '+' : ''}{formatJPY(latestSnapshot.totalProfit)}
              </span>
              {dailyChange !== null && (
                <>
                  <span className="text-text-secondary">前日比</span>
                  <span className={`font-mono ${dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dailyChange >= 0 ? '+' : ''}{formatJPY(dailyChange)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-text-secondary/50">資産データなし</span>
          )}

          <div className="w-px h-4 bg-border/50" />

          {/* 今月の損益 */}
          {monthlyStats.tradeCount > 0 ? (
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">今月確定</span>
              <span className={`font-mono font-semibold ${monthlyStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {monthlyStats.totalPnl >= 0 ? '+' : ''}¥{formatJPY(monthlyStats.totalPnl)}
              </span>
              <span className="text-text-secondary">勝率</span>
              <span className="font-mono text-text-primary">{monthlyStats.winRate.toFixed(1)}%</span>
              <span className="text-text-secondary">決済</span>
              <span className="font-mono text-text-primary">{monthlyStats.tradeCount}件</span>
            </div>
          ) : (
            <span className="text-text-secondary/50">今月の決済なし</span>
          )}
        </div>

        {/* ナビゲーションタブ（md以上） */}
        <nav className="hidden md:flex items-center gap-1 px-4 py-1 border-t border-border/50">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs rounded-md transition-all ${
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                }`
              }
            >
              {item.labelJa}
            </NavLink>
          ))}
        </nav>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
