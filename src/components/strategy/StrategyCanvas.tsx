import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { StrategyNote, StrategyConnection, StrategyNoteRegion, StrategyNoteDirection, StrategyDrawing } from '../../types';
import { DrawingLayer } from './DrawingLayer';
import type { DrawingTool } from './DrawingLayer';

interface StrategyCanvasProps {
  notes: StrategyNote[];
  connections: StrategyConnection[];
  drawing: StrategyDrawing;
  onUpdateDrawing: (drawing: StrategyDrawing) => void;
  onUpdateNote: (noteId: string, updates: Partial<Omit<StrategyNote, 'id'>>) => void;
  onRemoveNote: (noteId: string) => void;
  onAddConnection: (fromId: string, toId: string, direction: 'bullish' | 'bearish' | 'neutral') => void;
  onRemoveConnection: (connectionId: string) => void;
}

const DRAWING_COLORS = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];
const DRAWING_WIDTHS = [1, 2, 4];

const REGION_STYLES: Record<StrategyNoteRegion, { label: string; emoji: string; bg: string }> = {
  jp: { label: '日本', emoji: '🇯🇵', bg: 'bg-blue-500/15' },
  us: { label: '米国', emoji: '🇺🇸', bg: 'bg-red-500/15' },
  other: { label: 'その他', emoji: '🌐', bg: 'bg-slate-400/15' },
};

const DIRECTION_STYLES: Record<StrategyNoteDirection, { label: string; arrow: string; border: string; color: string }> = {
  bullish: { label: '上昇', arrow: '▲', border: 'border-emerald-500/50', color: 'text-emerald-400' },
  bearish: { label: '下落', arrow: '▼', border: 'border-red-500/50', color: 'text-red-400' },
  neutral: { label: '中立', arrow: '―', border: 'border-slate-400/50', color: 'text-slate-400' },
};

const CONNECTION_COLORS: Record<string, string> = {
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#94a3b8',
};

// Grid constants
const PRICE_MIN = 45000;
const PRICE_MAX = 70000;
const PRICE_STEP = 1000;
const MARGIN_LEFT = 65;
const MARGIN_TOP = 28;
const DAYS = 28;
const PX_PER_DAY = 70;
const CANVAS_HEIGHT = 1200;
const CANVAS_WIDTH = MARGIN_LEFT + DAYS * PX_PER_DAY;
const PRICE_RANGE = PRICE_MAX - PRICE_MIN;

const NOTE_WIDTH = 200;
const NOTE_HEIGHT_ESTIMATE = 100;

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function priceToY(price: number): number {
  return MARGIN_TOP + ((PRICE_MAX - price) / PRICE_RANGE) * (CANVAS_HEIGHT - MARGIN_TOP);
}

function formatDateLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`;
}

function formatNoteDateBadge(dateStr: string): { label: string; className: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const noteDate = new Date(dateStr + 'T00:00:00');
  const diffMs = noteDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const d = noteDate;
  const label = `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`;

  if (diffDays === 0) return { label: `${label} 今日`, className: 'bg-accent-cyan/30 text-accent-cyan border-accent-cyan/50' };
  if (diffDays > 0 && diffDays <= 7) return { label, className: 'bg-accent-gold/25 text-accent-gold border-accent-gold/50' };
  if (diffDays > 7) return { label, className: 'bg-primary/10 text-secondary border-primary/20' };
  return { label, className: 'bg-primary/5 text-muted border-primary/10' };
}

// Backward compat: old notes may have `category` instead of `region`/`direction`
function getNoteRegion(note: StrategyNote): StrategyNoteRegion {
  return note.region || 'jp';
}
function getNoteDirection(note: StrategyNote): StrategyNoteDirection {
  return note.direction || 'neutral';
}

export function StrategyCanvas({ notes, connections, drawing, onUpdateDrawing, onUpdateNote, onRemoveNote, onAddConnection, onRemoveConnection }: StrategyCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectDirection, setConnectDirection] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', region: 'jp' as StrategyNoteRegion, direction: 'neutral' as StrategyNoteDirection, url: '', date: '' });
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [drawingTool, setDrawingTool] = useState<DrawingTool | null>(null);
  const [drawingColor, setDrawingColor] = useState('#ffffff');
  const [drawingWidth, setDrawingWidth] = useState(2);
  const [drawingFontSize] = useState(14);

  const dateColumns = useMemo(() => {
    const today = new Date();
    const cols: { date: Date; x: number; isWeekend: boolean; isMonday: boolean }[] = [];
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      cols.push({ date: d, x: MARGIN_LEFT + i * PX_PER_DAY, isWeekend: dow === 0 || dow === 6, isMonday: dow === 1 });
    }
    return cols;
  }, []);

  const priceLines = useMemo(() => {
    const lines: { price: number; y: number; isMajor: boolean }[] = [];
    for (let p = PRICE_MIN; p <= PRICE_MAX; p += PRICE_STEP) {
      lines.push({ price: p, y: priceToY(p), isMajor: p % 5000 === 0 });
    }
    return lines;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, noteId: string) => {
    if (connectMode) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).closest('[data-note-id]')!.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingId(noteId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [connectMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - canvasRect.left + canvasRef.current.scrollLeft - dragOffset.x);
    const y = Math.max(0, e.clientY - canvasRect.top + canvasRef.current.scrollTop - dragOffset.y);
    onUpdateNote(draggingId, { x, y });
  }, [draggingId, dragOffset, onUpdateNote]);

  const handlePointerUp = useCallback(() => { setDraggingId(null); }, []);

  const handleNoteClick = useCallback((noteId: string) => {
    if (!connectMode) return;
    if (!connectFrom) { setConnectFrom(noteId); }
    else if (connectFrom !== noteId) { onAddConnection(connectFrom, noteId, connectDirection); setConnectFrom(null); }
  }, [connectMode, connectFrom, connectDirection, onAddConnection]);

  const startEdit = useCallback((note: StrategyNote) => {
    setEditingNote(note.id);
    setEditForm({ title: note.title, description: note.description, region: getNoteRegion(note), direction: getNoteDirection(note), url: note.url || '', date: note.date || '' });
  }, []);

  const saveEdit = useCallback(() => {
    if (editingNote) {
      onUpdateNote(editingNote, { title: editForm.title, description: editForm.description, region: editForm.region, direction: editForm.direction, url: editForm.url || undefined, date: editForm.date || undefined });
      setEditingNote(null);
    }
  }, [editingNote, editForm, onUpdateNote]);

  const getNoteCenter = useCallback((noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return { x: 0, y: 0 };
    return { x: note.x + NOTE_WIDTH / 2, y: note.y + NOTE_HEIGHT_ESTIMATE / 2 };
  }, [notes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setConnectMode(false); setConnectFrom(null); setEditingNote(null); setSelectedConnection(null); setDrawingTool(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col flex-1">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-primary/10 flex-shrink-0 flex-wrap">
        <button
          onClick={() => { setConnectMode(!connectMode); setConnectFrom(null); setDrawingTool(null); }}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${connectMode ? 'bg-accent-cyan text-black' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
        >
          {connectMode ? '🔗 結線モード ON' : '🔗 結線'}
        </button>
        {connectMode && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted mr-1">方向:</span>
            {(['bullish', 'bearish', 'neutral'] as const).map((d) => (
              <button key={d} onClick={() => setConnectDirection(d)}
                className={`px-2 py-1 rounded text-xs ${connectDirection === d ? 'ring-1 ring-white' : ''}`}
                style={{ backgroundColor: CONNECTION_COLORS[d] + '33', color: CONNECTION_COLORS[d] }}
              >
                {d === 'bullish' ? '↑上昇' : d === 'bearish' ? '↓下落' : '→中立'}
              </button>
            ))}
          </div>
        )}
        {connectMode && !connectFrom && <span className="text-xs text-muted">ノートをクリックで接続開始 / 線クリックで削除</span>}
        {connectFrom && <span className="text-xs text-accent-cyan animate-pulse">接続元を選択済み → 接続先のノートをクリック</span>}
        {selectedConnection && (
          <button onClick={() => { onRemoveConnection(selectedConnection); setSelectedConnection(null); }}
            className="px-3 py-1.5 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30">選択した線を削除</button>
        )}

        <div className="w-px h-5 bg-primary/20" />

        {/* Drawing tools */}
        <button
          onClick={() => { const next = drawingTool === 'pen' ? null : 'pen' as DrawingTool; setDrawingTool(next); if (next) setConnectMode(false); }}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawingTool === 'pen' ? 'bg-amber-500/30 text-amber-300' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
        >
          ✏️ ペン
        </button>
        <button
          onClick={() => { const next = drawingTool === 'strokeEraser' ? null : 'strokeEraser' as DrawingTool; setDrawingTool(next); if (next) setConnectMode(false); }}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawingTool === 'strokeEraser' ? 'bg-amber-500/30 text-amber-300' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
        >
          🧹 消しゴム
        </button>
        <button
          onClick={() => { const next = drawingTool === 'eraser' ? null : 'eraser' as DrawingTool; setDrawingTool(next); if (next) setConnectMode(false); }}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawingTool === 'eraser' ? 'bg-amber-500/30 text-amber-300' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
        >
          ◯ 範囲消し
        </button>
        <button
          onClick={() => { const next = drawingTool === 'text' ? null : 'text' as DrawingTool; setDrawingTool(next); if (next) setConnectMode(false); }}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawingTool === 'text' ? 'bg-amber-500/30 text-amber-300' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
        >
          Aa テキスト
        </button>
        {drawingTool && drawingTool !== 'strokeEraser' && (
          <>
            <div className="flex items-center gap-1">
              {DRAWING_COLORS.map((c) => (
                <button key={c} onClick={() => setDrawingColor(c)}
                  className={`w-5 h-5 rounded-full border-2 ${drawingColor === c ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            {drawingTool !== 'text' && (
              <div className="flex items-center gap-1">
                {DRAWING_WIDTHS.map((w) => (
                  <button key={w} onClick={() => setDrawingWidth(w)}
                    className={`px-1.5 py-1 rounded text-[10px] ${drawingWidth === w ? 'bg-white/20 text-white' : 'text-muted hover:text-white'}`}>
                    {w}px
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {drawingTool === 'strokeEraser' && (
          <span className="text-xs text-muted">線をクリックで削除 / ドラッグで連続削除</span>
        )}
        {(drawing.paths.length > 0 || drawing.texts.length > 0) && (
          <button
            onClick={() => onUpdateDrawing({ paths: [], texts: [] })}
            className="px-2 py-1.5 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            全消去
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted">
          <span>ドラッグ: 移動</span><span>ダブルクリック: 編集</span><span>ESC: キャンセル</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="flex-1 overflow-auto relative bg-[#080810]"
        style={{ cursor: connectMode ? 'crosshair' : 'default' }}
        onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {/* Background grid SVG */}
          <svg className="absolute inset-0 pointer-events-none" width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
            <defs>
              <marker id="arrowhead-bullish" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#22c55e" /></marker>
              <marker id="arrowhead-bearish" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#ef4444" /></marker>
              <marker id="arrowhead-neutral" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#94a3b8" /></marker>
            </defs>
            {dateColumns.filter((c) => c.isWeekend).map((col, i) => (
              <rect key={`we-${i}`} x={col.x} y={0} width={PX_PER_DAY} height={CANVAS_HEIGHT} fill="rgba(255,255,255,0.015)" />
            ))}
            {dateColumns.length > 0 && <rect x={dateColumns[0].x} y={0} width={PX_PER_DAY} height={CANVAS_HEIGHT} fill="rgba(0,210,255,0.03)" />}
            {priceLines.map((pl) => (
              <g key={pl.price}>
                <line x1={MARGIN_LEFT} y1={pl.y} x2={CANVAS_WIDTH} y2={pl.y} stroke={pl.isMajor ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'} strokeWidth={pl.isMajor ? 1 : 0.5} />
                <text x={MARGIN_LEFT - 5} y={pl.y + 4} fill={pl.isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)'} fontSize={pl.isMajor ? 13 : 11} textAnchor="end" fontFamily="monospace">{(pl.price / 10000).toFixed(1)}万</text>
              </g>
            ))}
            {dateColumns.map((col, i) => (
              <g key={i}>
                <line x1={col.x} y1={MARGIN_TOP} x2={col.x} y2={CANVAS_HEIGHT} stroke={col.isMonday ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'} strokeWidth={col.isMonday ? 1 : 0.5} />
                <text x={col.x + PX_PER_DAY / 2} y={16} fill={col.isWeekend ? 'rgba(255,255,255,0.25)' : col.isMonday ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.40)'} fontSize={12} textAnchor="middle" fontFamily="monospace" fontWeight={col.isMonday ? 'bold' : 'normal'}>{formatDateLabel(col.date)}</text>
                <text x={col.x + PX_PER_DAY / 2} y={CANVAS_HEIGHT - 4} fill={i === 0 ? 'rgba(0,210,255,0.7)' : col.isWeekend ? 'rgba(255,255,255,0.25)' : col.isMonday ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.40)'} fontSize={12} textAnchor="middle" fontFamily="monospace" fontWeight={col.isMonday || i === 0 ? 'bold' : 'normal'}>{i === 0 ? `今日 ${formatDateLabel(col.date)}` : formatDateLabel(col.date)}</text>
              </g>
            ))}
          </svg>

          {/* Connection lines */}
          <svg className="absolute inset-0" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ pointerEvents: 'none' }}>
            {connections.map((conn) => {
              const from = getNoteCenter(conn.fromId);
              const to = getNoteCenter(conn.toId);
              const color = CONNECTION_COLORS[conn.direction];
              const isSelected = selectedConnection === conn.id;
              return (
                <g key={conn.id}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth="12"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={() => { if (connectMode) { onRemoveConnection(conn.id); } else { setSelectedConnection(isSelected ? null : conn.id); } }} />
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={isSelected ? 3 : 2} strokeOpacity={isSelected ? 1 : 0.7} markerEnd={`url(#arrowhead-${conn.direction})`} />
                  {conn.label && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8} fill={color} fontSize="11" textAnchor="middle" style={{ pointerEvents: 'none' }}>{conn.label}</text>}
                </g>
              );
            })}
          </svg>

          {/* Drawing layer */}
          <DrawingLayer
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            drawing={drawing}
            onUpdateDrawing={onUpdateDrawing}
            activeTool={drawingTool}
            toolColor={drawingColor}
            toolWidth={drawingWidth}
            toolFontSize={drawingFontSize}
          />

          {/* Notes */}
          {notes.map((note) => {
            const region = getNoteRegion(note);
            const direction = getNoteDirection(note);
            const rStyle = REGION_STYLES[region];
            const dStyle = DIRECTION_STYLES[direction];
            const isConnectSource = connectFrom === note.id;
            const dateBadge = note.date ? formatNoteDateBadge(note.date) : null;
            return (
              <div key={note.id} data-note-id={note.id}
                className={`absolute select-none rounded-lg border-2 ${rStyle.bg} ${dStyle.border} ${isConnectSource ? 'ring-2 ring-accent-cyan' : ''} ${draggingId === note.id ? 'opacity-80 z-50' : 'z-10'}`}
                style={{ transform: `translate(${note.x}px, ${note.y}px)`, width: NOTE_WIDTH, cursor: connectMode ? 'pointer' : 'grab', backdropFilter: 'blur(8px)', pointerEvents: drawingTool ? 'none' : 'auto' }}
                onPointerDown={(e) => handlePointerDown(e, note.id)} onClick={() => handleNoteClick(note.id)} onDoubleClick={() => startEdit(note)}>
                {/* Header: region + direction */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{rStyle.emoji}</span>
                    <span className={`text-[10px] font-bold ${dStyle.color}`}>{dStyle.arrow} {dStyle.label}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); }} className="text-muted hover:text-red-400 text-xs leading-none">×</button>
                </div>
                {dateBadge && (
                  <div className="px-2 pt-1.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${dateBadge.className}`}>📅 {dateBadge.label}</span>
                  </div>
                )}
                <div className="px-2 py-1.5">
                  <div className="text-sm font-semibold text-primary truncate">{note.title}</div>
                  {note.description && <div className="text-xs text-secondary mt-0.5 line-clamp-3">{note.description}</div>}
                  {note.url && <a href={note.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-cyan hover:underline truncate block mt-1" onClick={(e) => e.stopPropagation()}>🔗 {note.url}</a>}
                  {note.sourceType && <div className="text-[10px] text-muted mt-1">📎 {note.sourceType === 'memo' ? 'メモ' : 'スケジュール'}から</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85" onClick={() => setEditingNote(null)}>
          <div className="bg-[#1a1a2e] border border-primary/30 rounded-xl p-5 w-full max-w-md shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-primary mb-3">ノートを編集</h3>
            <div className="space-y-3">
              {/* Region tags */}
              <div>
                <label className="text-xs text-muted block mb-1">地域</label>
                <div className="flex gap-1">
                  {(Object.entries(REGION_STYLES) as [StrategyNoteRegion, typeof REGION_STYLES[StrategyNoteRegion]][]).map(([key, s]) => (
                    <button key={key} onClick={() => setEditForm((f) => ({ ...f, region: key }))}
                      className={`flex-1 px-2 py-1.5 rounded text-xs border ${editForm.region === key ? `${s.bg} border-white/30 text-primary` : 'border-primary/10 text-muted'}`}>
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Direction tags */}
              <div>
                <label className="text-xs text-muted block mb-1">方向</label>
                <div className="flex gap-1">
                  {(Object.entries(DIRECTION_STYLES) as [StrategyNoteDirection, typeof DIRECTION_STYLES[StrategyNoteDirection]][]).map(([key, s]) => (
                    <button key={key} onClick={() => setEditForm((f) => ({ ...f, direction: key }))}
                      className={`flex-1 px-2 py-1.5 rounded text-xs border ${editForm.direction === key ? `${s.border} ${s.color}` : 'border-primary/10 text-muted'}`}>
                      {s.arrow} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">タイトル</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#12121e] border border-primary/20 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">説明</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 bg-[#12121e] border border-primary/20 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">日付（任意）</label>
                  <div className="relative">
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 pr-8 bg-[#12121e] border border-primary/20 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan" />
                    {editForm.date && (
                      <button type="button" onClick={() => setEditForm((f) => ({ ...f, date: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary text-sm">×</button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">URL（任意）</label>
                  <input type="text" value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#12121e] border border-primary/20 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan" placeholder="https://..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-xs text-muted hover:text-primary rounded-lg hover:bg-primary/10">キャンセル</button>
                <button onClick={saveEdit} className="px-4 py-2 text-xs bg-accent-cyan text-black rounded-lg font-medium hover:bg-accent-cyan/80">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
