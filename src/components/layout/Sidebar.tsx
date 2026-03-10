import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';
import { useSchedule } from '../../hooks/useSchedule';
import { useSidebarTodos, useSidebarPrinciples } from '../../hooks/useSidebarNotes';

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
  strategy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  portfolio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  vision: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  assignment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  tradeMethods: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
  scenario: 'bg-violet-400',
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { events } = useSchedule();
  const {
    dailyItems, oneshotItems, archive,
    addDailyTodo, toggleDailyTodo, deleteDailyTodo,
    addOneshotTodo, toggleOneshotTodo, deleteOneshotTodo,
    deleteArchiveItem,
  } = useSidebarTodos();
  const { principles, setPrinciples } = useSidebarPrinciples();
  const [newDailyText, setNewDailyText] = useState('');
  const [newOneshotText, setNewOneshotText] = useState('');
  const [showArchive, setShowArchive] = useState(false);

  // Get today's important events (high and medium)
  const todayStr = new Date().toISOString().split('T')[0];
  const IMPORTANCE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, scenario: 3 };
  const IMPORTANCE_LABEL: Record<string, { text: string; className: string }> = {
    high: { text: '重要', className: 'bg-red-500/20 text-red-400' },
    medium: { text: '中', className: 'bg-amber-400/20 text-amber-400' },
    low: { text: '低', className: 'bg-cyan-400/20 text-cyan-400' },
    scenario: { text: 'シナリオ', className: 'bg-violet-400/20 text-violet-400' },
  };
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => (IMPORTANCE_ORDER[a.importance] ?? 9) - (IMPORTANCE_ORDER[b.importance] ?? 9) || a.time.localeCompare(b.time));

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
        className={`fixed top-16 md:top-[124px] left-0 bottom-0 z-40 w-64 bg-bg-secondary/95 backdrop-blur-md border-r border-border transform transition-transform duration-300 overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* ナビゲーション（モバイルのみ） */}
        <nav className="p-4 space-y-1 md:hidden">
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

        {/* 本日の重要イベント */}
        <div className="p-4 border-t border-border">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            本日のイベント
          </h3>
          <div className="space-y-2">
            {todayEvents.length === 0 && (
              <p className="text-text-secondary/50 text-xs">本日のイベントはありません</p>
            )}
            {todayEvents.map((event) => {
              const badge = IMPORTANCE_LABEL[event.importance];
              return (
                <div key={event.id} className="flex items-start gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${IMPORTANCE_DOT[event.importance]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-text-secondary whitespace-nowrap text-[11px]">
                        {event.time}
                      </span>
                      {event.region && REGION_FLAG[event.region] ? <span className="text-[10px]">{REGION_FLAG[event.region]}</span> : null}
                      {badge && <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${badge.className}`}>{badge.text}</span>}
                    </div>
                    <p className="text-xs text-text-primary leading-tight mt-0.5">{event.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Todoリスト */}
        <div className="p-4 border-t border-border">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            TODOリスト
          </h3>

          {/* 毎日のチェック */}
          <div className="mb-3">
            <p className="text-[10px] text-accent-cyan/80 font-semibold mb-1.5 uppercase tracking-wider">毎日のチェック</p>
            <div className="space-y-1.5">
              {dailyItems.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleDailyTodo(todo.id)}
                    className="w-3.5 h-3.5 rounded border-border bg-transparent accent-accent-cyan shrink-0 cursor-pointer"
                  />
                  <span className={`text-xs flex-1 ${todo.done ? 'line-through text-text-secondary/50' : 'text-text-primary'}`}>
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteDailyTodo(todo.id)}
                    className="text-text-secondary/30 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1.5">
              <input
                type="text"
                value={newDailyText}
                onChange={(e) => setNewDailyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDailyText.trim()) {
                    addDailyTodo(newDailyText);
                    setNewDailyText('');
                  }
                }}
                placeholder="+ 毎日タスクを追加..."
                className="w-full bg-transparent border border-border/50 rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-cyan/50"
              />
            </div>
          </div>

          {/* 一度きり */}
          <div className="mb-3">
            <p className="text-[10px] text-amber-400/80 font-semibold mb-1.5 uppercase tracking-wider">一度きり</p>
            <div className="space-y-1.5">
              {oneshotItems.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleOneshotTodo(todo.id)}
                    className="w-3.5 h-3.5 rounded border-border bg-transparent accent-amber-400 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs flex-1 text-text-primary">
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteOneshotTodo(todo.id)}
                    className="text-text-secondary/30 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1.5">
              <input
                type="text"
                value={newOneshotText}
                onChange={(e) => setNewOneshotText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOneshotText.trim()) {
                    addOneshotTodo(newOneshotText);
                    setNewOneshotText('');
                  }
                }}
                placeholder="+ 一度きりタスクを追加..."
                className="w-full bg-transparent border border-border/50 rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>

          {/* アーカイブ */}
          {archive.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="flex items-center gap-1 text-[10px] text-text-secondary/60 hover:text-text-secondary transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showArchive ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                アーカイブ ({archive.length}件)
              </button>
              {showArchive && (
                <div className="mt-1.5 space-y-1 pl-1">
                  {archive.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <span className="text-text-secondary/40 text-[10px]">✓</span>
                      <span className="text-xs flex-1 line-through text-text-secondary/40">
                        {item.text}
                      </span>
                      <span className="text-[9px] text-text-secondary/30 font-mono">
                        {new Date(item.completedAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                      </span>
                      <button
                        onClick={() => deleteArchiveItem(item.id)}
                        className="text-text-secondary/20 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 常に意識すること */}
        <div className="p-4 border-t border-border">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            常に意識すること
          </h3>
          <textarea
            value={principles}
            onChange={(e) => setPrinciples(e.target.value)}
            placeholder="投資ルールや心得を記入..."
            rows={5}
            className="w-full bg-transparent border border-border/50 rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-cyan/50 resize-y leading-relaxed"
          />
        </div>
      </aside>
    </>
  );
}
