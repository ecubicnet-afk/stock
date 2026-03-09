import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';
import { useSchedule } from '../../hooks/useSchedule';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
    </svg>
  ),
  memo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  schedule: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  journal: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  watchlist: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  tradeAnalysis: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  portfolio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
};

const REGION_FLAG: Record<string, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
};

const IMPORTANCE_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-cyan-400',
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { events } = useSchedule();

  // Get today's important events (high and medium)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events
    .filter((e) => e.date === todayStr && (e.importance === 'high' || e.importance === 'medium'))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      {/* オーバーレイ背景（モバイル） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー本体 */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 bg-bg-secondary/95 backdrop-blur-md border-r border-border transform transition-transform duration-300 overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* ナビゲーション */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                }`
              }
            >
              {ICONS[item.icon]}
              <span>{item.labelJa}</span>
            </NavLink>
          ))}
        </nav>

        {/* クイックメモ */}
        <div className="p-4 border-t border-border">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            クイックメモ
          </h3>
          <textarea
            className="w-full h-20 bg-bg-primary/50 border border-border rounded-lg p-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-secondary/50"
            placeholder="メモを入力..."
          />
          <button className="mt-2 w-full py-1.5 bg-accent-cyan/20 text-accent-cyan text-xs rounded-lg hover:bg-accent-cyan/30 transition-colors">
            保存
          </button>
        </div>

        {/* 本日の重要イベント */}
        <div className="p-4 border-t border-border">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            本日の重要イベント
          </h3>
          <div className="space-y-2">
            {todayEvents.length === 0 && (
              <p className="text-text-secondary/50 text-xs">本日のイベントはありません</p>
            )}
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-1.5 text-xs">
                <span className="font-mono text-text-secondary whitespace-nowrap">
                  {event.time}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${IMPORTANCE_DOT[event.importance]}`}
                />
                <span className="text-text-primary">
                  {event.region && REGION_FLAG[event.region] ? <span className="text-[10px] mr-0.5">{REGION_FLAG[event.region]}</span> : null}
                  {event.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
