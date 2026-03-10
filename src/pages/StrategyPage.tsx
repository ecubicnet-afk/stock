import { useState, useCallback, useMemo, useRef } from 'react';
import { useStrategy } from '../hooks/useStrategy';
import { useMemos } from '../hooks/useMemos';
import { useSchedule } from '../hooks/useSchedule';
import { StrategyCanvas } from '../components/strategy/StrategyCanvas';
import { RichTextEditor } from '../components/common/RichTextEditor';
import type { StrategyNoteRegion, StrategyNoteDirection } from '../types';

const REGION_OPTIONS: { value: StrategyNoteRegion; label: string; emoji: string }[] = [
  { value: 'jp', label: '日本', emoji: '🇯🇵' },
  { value: 'us', label: '米国', emoji: '🇺🇸' },
  { value: 'other', label: 'その他', emoji: '🌐' },
];

const DIRECTION_OPTIONS: { value: StrategyNoteDirection; label: string; emoji: string }[] = [
  { value: 'bullish', label: '上昇要因', emoji: '▲' },
  { value: 'bearish', label: '下落要因', emoji: '▼' },
  { value: 'neutral', label: '中立', emoji: '―' },
];


function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


export function StrategyPage() {
  const { data, addNote, updateNote, removeNote, addConnection, removeConnection, updateSummary, updateScenarioDescription } = useStrategy();
  const { memos, addMemo } = useMemos();
  const { events, addEvent } = useSchedule();

  const scenarioId = data.scenarios[0]?.id ?? 'main';
  const activeScenario = data.scenarios[0];

  const [showAddNote, setShowAddNote] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showScenario, setShowScenario] = useState(true);
  const [newNote, setNewNote] = useState({ title: '', description: '', region: 'jp' as StrategyNoteRegion, direction: 'neutral' as StrategyNoteDirection, url: '', date: '' });
  const [newUrl, setNewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const desc = data.scenarioDescription;
  const zoom = desc.imageZoom ?? 100;

  const importedSourceIds = useMemo(() => {
    if (!activeScenario) return new Set<string>();
    return new Set(activeScenario.notes.filter((n) => n.sourceId).map((n) => n.sourceId!));
  }, [activeScenario]);

  const handleAddNote = useCallback(() => {
    if (!newNote.title.trim()) return;
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    addNote(scenarioId, newNote.region, newNote.direction, newNote.title, newNote.description, x, y, newNote.url || undefined, undefined, undefined, newNote.date || undefined);
    setNewNote({ title: '', description: '', region: 'jp', direction: 'neutral', url: '', date: '' });
    setShowAddNote(false);
  }, [scenarioId, newNote, addNote]);

  const handleImportMemo = useCallback((memoId: string, text: string, createdAt: string) => {
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    const title = text.length > 40 ? text.slice(0, 40) + '…' : text;
    const memoDate = createdAt.split('T')[0];
    addNote(scenarioId, 'jp', 'neutral', title, text, x, y, undefined, 'memo', memoId, memoDate);
  }, [scenarioId, addNote]);

  const handleImportEvent = useCallback((eventId: string, title: string, description: string, eventDate: string) => {
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    addNote(scenarioId, 'jp', 'neutral', title, description, x, y, undefined, 'schedule', eventId, eventDate);
  }, [scenarioId, addNote]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 1200);
    updateScenarioDescription({ imageDataUrl: dataUrl, imageZoom: 100 });
    e.target.value = '';
  }, [updateScenarioDescription]);

  const handleAddUrl = useCallback(() => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    updateScenarioDescription({ urls: [...desc.urls, trimmed] });
    setNewUrl('');
  }, [newUrl, desc.urls, updateScenarioDescription]);

  const handleRemoveUrl = useCallback((index: number) => {
    updateScenarioDescription({ urls: desc.urls.filter((_, i) => i !== index) });
  }, [desc.urls, updateScenarioDescription]);

  const getPlainText = useCallback(() => {
    const tmp = document.createElement('div');
    tmp.innerHTML = desc.text || '';
    return tmp.textContent || tmp.innerText || '';
  }, [desc.text]);

  const handleSaveToMemo = useCallback(() => {
    const plainText = getPlainText();
    if (!plainText.trim()) return;
    addMemo(plainText);
  }, [addMemo, getPlainText]);

  const handleSaveToSchedule = useCallback(() => {
    const plainText = getPlainText();
    if (!plainText.trim() || !desc.date) return;
    addEvent({
      title: '想定シナリオ',
      date: desc.date,
      time: '00:00',
      importance: 'scenario',
      description: plainText,
      region: 'JP',
      images: desc.imageDataUrl ? [desc.imageDataUrl] : undefined,
    });
  }, [addEvent, desc.date, desc.imageDataUrl, getPlainText]);

  if (!activeScenario) return null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-primary">戦略立案キャンバス</h1>
          <p className="text-xs text-muted">Nikkei MacroWave Canvas — 日経マクロウェーブ作戦司令室</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScenario(!showScenario)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showScenario ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
          >
            📋 想定シナリオ
          </button>
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

      {/* Scenario Description Panel */}
      {showScenario && (
        <div className="flex-shrink-0 border-b border-primary/10 px-4 py-3 bg-amber-500/5">
          {/* Header bar with date + save buttons */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-xs font-semibold text-amber-300">想定シナリオ</h3>
            <div className="h-4 w-px bg-primary/20" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted">📅</span>
              <input
                type="date"
                value={desc.date || ''}
                onChange={(e) => updateScenarioDescription({ date: e.target.value })}
                className="px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded text-[11px] text-primary focus:outline-none focus:border-amber-400/50"
              />
              {desc.date && (
                <button onClick={() => updateScenarioDescription({ date: undefined })} className="text-muted hover:text-primary text-xs">×</button>
              )}
            </div>
            <div className="flex-1" />
            <button onClick={handleSaveToMemo} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded text-[10px] hover:bg-amber-500/20">
              📝 メモに保存
            </button>
            <button
              onClick={handleSaveToSchedule}
              disabled={!desc.date}
              className={`px-2 py-0.5 rounded text-[10px] ${desc.date ? 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' : 'bg-primary/5 text-muted cursor-not-allowed'}`}
            >
              📅 スケジュールに追加
            </button>
          </div>

          <div className="flex items-stretch gap-4">
            {/* Rich text editor */}
            <div className="flex-1 space-y-2 min-w-0">
              <RichTextEditor
                value={desc.text}
                onChange={(html) => updateScenarioDescription({ text: html })}
                placeholder="直近の想定シナリオを記入..."
                accentColor="amber"
              />
              {/* URLs */}
              <div className="space-y-1">
                {desc.urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <span className="text-muted">🔗</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline truncate flex-1">{url}</a>
                    <button onClick={() => handleRemoveUrl(i)} className="text-muted hover:text-red-400 text-xs px-1">×</button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                    placeholder="URL を追加..."
                    className="flex-1 px-2 py-1 bg-primary/5 border border-primary/10 rounded text-xs text-primary focus:outline-none focus:border-amber-400/50"
                  />
                  <button onClick={handleAddUrl} className="px-2 py-1 bg-primary/10 text-muted hover:text-primary rounded text-xs">追加</button>
                </div>
              </div>
            </div>
            {/* Image area with zoom */}
            <div className="flex-1 min-w-0 flex flex-col">
              {desc.imageDataUrl ? (
                <>
                  {/* Zoom controls */}
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <button
                      onClick={() => updateScenarioDescription({ imageZoom: Math.max(25, zoom - 25) })}
                      className="w-6 h-6 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 flex items-center justify-center"
                    >−</button>
                    <span className="text-[10px] text-muted font-mono w-10 text-center">{zoom}%</span>
                    <button
                      onClick={() => updateScenarioDescription({ imageZoom: Math.min(300, zoom + 25) })}
                      className="w-6 h-6 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 flex items-center justify-center"
                    >+</button>
                    <button
                      onClick={() => updateScenarioDescription({ imageZoom: 100 })}
                      className="text-[10px] text-muted hover:text-primary"
                    >リセット</button>
                  </div>
                  {/* Image with zoom */}
                  <div className="relative group flex-1 overflow-auto rounded-lg border border-primary/10 bg-black/20">
                    <img
                      src={desc.imageDataUrl}
                      alt="scenario"
                      style={{ width: `${zoom}%`, maxWidth: 'none', transformOrigin: 'top left' }}
                    />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/90"
                        title="画像を変更"
                      >📷</button>
                      <button
                        onClick={() => updateScenarioDescription({ imageDataUrl: undefined, imageZoom: 100 })}
                        className="w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600/80"
                      >×</button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full min-h-[120px] border-2 border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center text-muted hover:border-amber-400/30 hover:text-amber-300 transition-colors"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-xs mt-1">画像を添付</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-h-[700px]">
        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <StrategyCanvas
            notes={activeScenario.notes}
            connections={activeScenario.connections}
            onUpdateNote={(noteId, updates) => updateNote(scenarioId, noteId, updates)}
            onRemoveNote={(noteId) => removeNote(scenarioId, noteId)}
            onAddConnection={(fromId, toId, direction) => addConnection(scenarioId, fromId, toId, direction)}
            onRemoveConnection={(connId) => removeConnection(scenarioId, connId)}
          />

          {/* Summary */}
          <div className="flex-shrink-0 border-t border-primary/10 px-4 py-2">
            <textarea
              value={activeScenario.summary}
              onChange={(e) => updateSummary(scenarioId, e.target.value)}
              placeholder="サマリーを記入..."
              rows={2}
              className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary focus:outline-none focus:border-accent-cyan resize-none"
            />
          </div>
        </div>

        {/* Side panels */}
        <div className="flex flex-col flex-shrink-0 border-l border-primary/10 overflow-hidden" style={{ width: showAddNote || showImport ? 320 : 0, transition: 'width 0.2s' }}>
          <div className="p-3 space-y-4 overflow-y-auto" style={{ width: 320, maxHeight: 700 }}>
            {/* Add Note Panel */}
            {showAddNote && (
              <div className="bg-card border border-primary/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">新規ノート</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">地域</label>
                    <div className="flex gap-1">
                      {REGION_OPTIONS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setNewNote((n) => ({ ...n, region: r.value }))}
                          className={`flex-1 px-2 py-1.5 rounded text-xs ${newNote.region === r.value ? 'bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30' : 'bg-primary/5 text-muted hover:bg-primary/10'}`}
                        >
                          {r.emoji} {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted block mb-1">方向</label>
                    <div className="flex gap-1">
                      {DIRECTION_OPTIONS.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setNewNote((n) => ({ ...n, direction: d.value }))}
                          className={`flex-1 px-2 py-1.5 rounded text-xs ${newNote.direction === d.value ? (d.value === 'bullish' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : d.value === 'bearish' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' : 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/30') : 'bg-primary/5 text-muted hover:bg-primary/10'}`}
                        >
                          {d.emoji} {d.label}
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
