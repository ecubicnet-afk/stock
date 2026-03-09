import { useState, useCallback, useMemo } from 'react';
import { useStrategy } from '../hooks/useStrategy';
import { useMemos } from '../hooks/useMemos';
import { useSchedule } from '../hooks/useSchedule';
import { StrategyCanvas } from '../components/strategy/StrategyCanvas';
import type { StrategyNoteCategory } from '../types';

const SCENARIO_TABS = [
  { id: 'bullish', label: '楽観シナリオ', emoji: '🟢', desc: '順張り・ベースライン継続' },
  { id: 'bearish', label: '悲観シナリオ', emoji: '🟡', desc: '調整・初押しの回復効果' },
  { id: 'crisis', label: '最悪シナリオ', emoji: '🔴', desc: '破産回避・絶対撤退ライン' },
] as const;

const CATEGORY_OPTIONS: { value: StrategyNoteCategory; label: string; emoji: string }[] = [
  { value: 'macro', label: '外圧・マクロ', emoji: '🟦' },
  { value: 'internal', label: '観客・内部燃料', emoji: '🟩' },
  { value: 'technical', label: '物理的波動', emoji: '🟥' },
  { value: 'psychology', label: '心理・感情', emoji: '🟨' },
];

export function StrategyPage() {
  const { data, addNote, updateNote, removeNote, addConnection, removeConnection, updateSummary } = useStrategy();
  const { memos } = useMemos();
  const { events } = useSchedule();

  const [activeTab, setActiveTab] = useState<string>('bullish');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', description: '', category: 'macro' as StrategyNoteCategory, url: '', date: '' });

  const activeScenario = useMemo(() => data.scenarios.find((s) => s.id === activeTab), [data.scenarios, activeTab]);

  const importedSourceIds = useMemo(() => {
    if (!activeScenario) return new Set<string>();
    return new Set(activeScenario.notes.filter((n) => n.sourceId).map((n) => n.sourceId!));
  }, [activeScenario]);

  const handleAddNote = useCallback(() => {
    if (!newNote.title.trim()) return;
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    addNote(activeTab, newNote.category, newNote.title, newNote.description, x, y, newNote.url || undefined, undefined, undefined, newNote.date || undefined);
    setNewNote({ title: '', description: '', category: 'macro', url: '', date: '' });
    setShowAddNote(false);
  }, [activeTab, newNote, addNote]);

  const handleImportMemo = useCallback((memoId: string, text: string, createdAt: string) => {
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    const title = text.length > 40 ? text.slice(0, 40) + '…' : text;
    const memoDate = createdAt.split('T')[0];
    addNote(activeTab, 'psychology', title, text, x, y, undefined, 'memo', memoId, memoDate);
  }, [activeTab, addNote]);

  const handleImportEvent = useCallback((eventId: string, title: string, description: string, eventDate: string) => {
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    addNote(activeTab, 'macro', title, description, x, y, undefined, 'schedule', eventId, eventDate);
  }, [activeTab, addNote]);

  if (!activeScenario) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-primary">戦略立案キャンバス</h1>
          <p className="text-xs text-muted">Nikkei MacroWave Canvas — 日経マクロウェーブ作戦司令室</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showImport ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
          >
            📎 インポート
          </button>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showAddNote ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-accent-cyan text-black hover:bg-accent-cyan/80'}`}
          >
            ＋ ノート追加
          </button>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex border-b border-primary/10 flex-shrink-0">
        {SCENARIO_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-primary border-accent-cyan bg-accent-cyan/5'
                : 'text-muted border-transparent hover:text-secondary hover:bg-primary/5'
            }`}
          >
            <span className="mr-1">{tab.emoji}</span>
            {tab.label}
            <span className="text-[10px] text-muted ml-2 hidden sm:inline">{tab.desc}</span>
            <span className="text-[10px] text-muted ml-2">
              ({data.scenarios.find((s) => s.id === tab.id)?.notes.length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <StrategyCanvas
            notes={activeScenario.notes}
            connections={activeScenario.connections}
            onUpdateNote={(noteId, updates) => updateNote(activeTab, noteId, updates)}
            onRemoveNote={(noteId) => removeNote(activeTab, noteId)}
            onAddConnection={(fromId, toId, direction) => addConnection(activeTab, fromId, toId, direction)}
            onRemoveConnection={(connId) => removeConnection(activeTab, connId)}
          />

          {/* Summary */}
          <div className="flex-shrink-0 border-t border-primary/10 px-4 py-2">
            <textarea
              value={activeScenario.summary}
              onChange={(e) => updateSummary(activeTab, e.target.value)}
              placeholder={`${SCENARIO_TABS.find((t) => t.id === activeTab)?.label}のサマリーを記入...`}
              rows={2}
              className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary focus:outline-none focus:border-accent-cyan resize-none"
            />
          </div>
        </div>

        {/* Side panels */}
        <div className="flex flex-col flex-shrink-0 overflow-y-auto border-l border-primary/10" style={{ width: showAddNote || showImport ? 320 : 0, transition: 'width 0.2s' }}>
          <div className="p-3 space-y-4" style={{ width: 320 }}>
            {/* Add Note Panel */}
            {showAddNote && (
              <div className="bg-card border border-primary/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">新規ノート</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">カテゴリ</label>
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setNewNote((n) => ({ ...n, category: cat.value }))}
                          className={`px-2 py-1.5 rounded text-xs text-left ${newNote.category === cat.value ? 'bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30' : 'bg-primary/5 text-muted hover:bg-primary/10'}`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted block mb-1">タイトル</label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote((n) => ({ ...n, title: e.target.value }))}
                      placeholder="例: 米CPI上振れ"
                      className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted block mb-1">説明</label>
                    <textarea
                      value={newNote.description}
                      onChange={(e) => setNewNote((n) => ({ ...n, description: e.target.value }))}
                      rows={2}
                      placeholder="詳細な説明..."
                      className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted block mb-1">日付（任意）</label>
                      <input
                        type="date"
                        value={newNote.date}
                        onChange={(e) => setNewNote((n) => ({ ...n, date: e.target.value }))}
                        className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted block mb-1">URL（任意）</label>
                      <input
                        type="text"
                        value={newNote.url}
                        onChange={(e) => setNewNote((n) => ({ ...n, url: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan"
                      />
                    </div>
                  </div>
                  <button onClick={handleAddNote} className="w-full py-2 bg-accent-cyan text-black rounded-lg text-xs font-medium hover:bg-accent-cyan/80">
                    キャンバスに追加
                  </button>
                </div>
              </div>
            )}

            {/* Import Panel */}
            {showImport && (
              <div className="bg-card border border-primary/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">📎 メモ＆スケジュールからインポート</h3>

                {/* Memos */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-muted mb-2">メモ ({memos.length}件)</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {memos.length === 0 && <p className="text-[10px] text-muted">メモがありません</p>}
                    {memos.map((memo) => {
                      const alreadyImported = importedSourceIds.has(memo.id);
                      return (
                        <button
                          key={memo.id}
                          onClick={() => !alreadyImported && handleImportMemo(memo.id, memo.text, memo.createdAt)}
                          disabled={alreadyImported}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs ${alreadyImported ? 'bg-primary/5 text-muted opacity-50' : 'bg-amber-400/10 text-secondary hover:bg-amber-400/20 border border-amber-400/10'}`}
                        >
                          <div className="truncate">{alreadyImported ? '✓ ' : '🟨 '}{memo.text}</div>
                          <div className="text-[10px] text-muted">{new Date(memo.createdAt).toLocaleDateString('ja-JP')}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule Events */}
                <div>
                  <h4 className="text-xs font-medium text-muted mb-2">スケジュール (直近30件)</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {events.length === 0 && <p className="text-[10px] text-muted">イベントがありません</p>}
                    {events.slice(0, 30).map((event) => {
                      const alreadyImported = importedSourceIds.has(event.id);
                      return (
                        <button
                          key={event.id}
                          onClick={() => !alreadyImported && handleImportEvent(event.id, event.title, event.description || '', event.date)}
                          disabled={alreadyImported}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs ${alreadyImported ? 'bg-primary/5 text-muted opacity-50' : 'bg-blue-500/10 text-secondary hover:bg-blue-500/20 border border-blue-500/10'}`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{alreadyImported ? '✓' : '🟦'}</span>
                            <span className="truncate flex-1">{event.title}</span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.importance === 'high' ? 'bg-red-500' : event.importance === 'medium' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                          </div>
                          <div className="text-[10px] text-muted">{event.date} {event.time}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
