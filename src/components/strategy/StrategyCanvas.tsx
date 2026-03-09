import { useState, useRef, useCallback, useEffect } from 'react';
import type { StrategyNote, StrategyConnection, StrategyNoteCategory } from '../../types';

interface StrategyCanvasProps {
  notes: StrategyNote[];
  connections: StrategyConnection[];
  onUpdateNote: (noteId: string, updates: Partial<Omit<StrategyNote, 'id'>>) => void;
  onRemoveNote: (noteId: string) => void;
  onAddConnection: (fromId: string, toId: string, direction: 'bullish' | 'bearish' | 'neutral') => void;
  onRemoveConnection: (connectionId: string) => void;
}

const CATEGORY_STYLES: Record<StrategyNoteCategory, { bg: string; border: string; label: string; emoji: string }> = {
  macro: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', label: '外圧・マクロ', emoji: '🟦' },
  internal: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', label: '観客・内部燃料', emoji: '🟩' },
  technical: { bg: 'bg-red-500/20', border: 'border-red-500/50', label: '物理的波動', emoji: '🟥' },
  psychology: { bg: 'bg-amber-400/20', border: 'border-amber-400/50', label: '心理・感情', emoji: '🟨' },
};

const CONNECTION_COLORS: Record<string, string> = {
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#94a3b8',
};

const NOTE_WIDTH = 200;
const NOTE_HEIGHT_ESTIMATE = 100;

export function StrategyCanvas({ notes, connections, onUpdateNote, onRemoveNote, onAddConnection, onRemoveConnection }: StrategyCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectDirection, setConnectDirection] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'macro' as StrategyNoteCategory, url: '' });
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent, noteId: string) => {
    if (connectMode) return;
    e.preventDefault();
    e.stopPropagation();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const rect = (e.target as HTMLElement).closest('[data-note-id]')!.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingId(noteId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [connectMode, notes]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    const x = Math.max(0, e.clientX - canvasRect.left + scrollLeft - dragOffset.x);
    const y = Math.max(0, e.clientY - canvasRect.top + scrollTop - dragOffset.y);
    onUpdateNote(draggingId, { x, y });
  }, [draggingId, dragOffset, onUpdateNote]);

  const handlePointerUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Connect mode click
  const handleNoteClick = useCallback((noteId: string) => {
    if (!connectMode) return;
    if (!connectFrom) {
      setConnectFrom(noteId);
    } else if (connectFrom !== noteId) {
      onAddConnection(connectFrom, noteId, connectDirection);
      setConnectFrom(null);
    }
  }, [connectMode, connectFrom, connectDirection, onAddConnection]);

  // Edit handlers
  const startEdit = useCallback((note: StrategyNote) => {
    setEditingNote(note.id);
    setEditForm({ title: note.title, description: note.description, category: note.category, url: note.url || '' });
  }, []);

  const saveEdit = useCallback(() => {
    if (editingNote) {
      onUpdateNote(editingNote, { title: editForm.title, description: editForm.description, category: editForm.category, url: editForm.url || undefined });
      setEditingNote(null);
    }
  }, [editingNote, editForm, onUpdateNote]);

  // Get note center for SVG lines
  const getNoteCenter = useCallback((noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return { x: 0, y: 0 };
    return { x: note.x + NOTE_WIDTH / 2, y: note.y + NOTE_HEIGHT_ESTIMATE / 2 };
  }, [notes]);

  // ESC to cancel connect mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectMode(false);
        setConnectFrom(null);
        setEditingNote(null);
        setSelectedConnection(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-primary/10 flex-shrink-0 flex-wrap">
        <button
          onClick={() => { setConnectMode(!connectMode); setConnectFrom(null); }}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${connectMode ? 'bg-accent-cyan text-black' : 'bg-primary/10 text-secondary hover:bg-primary/20'}`}
        >
          {connectMode ? '🔗 結線モード ON' : '🔗 結線'}
        </button>
        {connectMode && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted mr-1">方向:</span>
            {(['bullish', 'bearish', 'neutral'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setConnectDirection(d)}
                className={`px-2 py-1 rounded text-xs ${connectDirection === d ? 'ring-1 ring-white' : ''}`}
                style={{ backgroundColor: CONNECTION_COLORS[d] + '33', color: CONNECTION_COLORS[d] }}
              >
                {d === 'bullish' ? '↑上昇' : d === 'bearish' ? '↓下落' : '→中立'}
              </button>
            ))}
          </div>
        )}
        {connectFrom && (
          <span className="text-xs text-accent-cyan animate-pulse">接続元を選択済み → 接続先のノートをクリック</span>
        )}
        {selectedConnection && (
          <button
            onClick={() => { onRemoveConnection(selectedConnection); setSelectedConnection(null); }}
            className="px-3 py-1.5 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            選択した線を削除
          </button>
        )}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted">
          <span>ドラッグ: 移動</span>
          <span>ダブルクリック: 編集</span>
          <span>ESC: キャンセル</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto relative bg-[#0a0a14]"
        style={{ cursor: connectMode ? 'crosshair' : 'default' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="relative" style={{ minWidth: 2000, minHeight: 1200 }}>
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 2000, minHeight: 1200 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
              <marker id="arrowhead-bullish" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-bearish" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
              </marker>
              <marker id="arrowhead-neutral" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Connection lines (SVG overlay) */}
          <svg className="absolute inset-0 w-full h-full" style={{ minWidth: 2000, minHeight: 1200, pointerEvents: 'none' }}>
            {connections.map((conn) => {
              const from = getNoteCenter(conn.fromId);
              const to = getNoteCenter(conn.toId);
              const color = CONNECTION_COLORS[conn.direction];
              const isSelected = selectedConnection === conn.id;
              return (
                <g key={conn.id}>
                  {/* Clickable invisible wider line */}
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="transparent" strokeWidth="12"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={() => setSelectedConnection(isSelected ? null : conn.id)}
                  />
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={color} strokeWidth={isSelected ? 3 : 2} strokeOpacity={isSelected ? 1 : 0.7}
                    markerEnd={`url(#arrowhead-${conn.direction})`}
                  />
                  {conn.label && (
                    <text
                      x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8}
                      fill={color} fontSize="11" textAnchor="middle" style={{ pointerEvents: 'none' }}
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Notes */}
          {notes.map((note) => {
            const style = CATEGORY_STYLES[note.category];
            const isConnectSource = connectFrom === note.id;
            return (
              <div
                key={note.id}
                data-note-id={note.id}
                className={`absolute select-none rounded-lg border ${style.bg} ${style.border} ${isConnectSource ? 'ring-2 ring-accent-cyan' : ''} ${draggingId === note.id ? 'opacity-80 z-50' : 'z-10'} backdrop-blur-sm`}
                style={{ transform: `translate(${note.x}px, ${note.y}px)`, width: NOTE_WIDTH, cursor: connectMode ? 'pointer' : 'grab' }}
                onPointerDown={(e) => handlePointerDown(e, note.id)}
                onClick={() => handleNoteClick(note.id)}
                onDoubleClick={() => startEdit(note)}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/5">
                  <span className="text-[10px] text-muted">{style.emoji} {style.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); }}
                    className="text-muted hover:text-red-400 text-xs leading-none"
                  >
                    ×
                  </button>
                </div>
                {/* Body */}
                <div className="px-2 py-1.5">
                  <div className="text-sm font-semibold text-primary truncate">{note.title}</div>
                  {note.description && (
                    <div className="text-xs text-secondary mt-0.5 line-clamp-3">{note.description}</div>
                  )}
                  {note.url && (
                    <a href={note.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-cyan hover:underline truncate block mt-1" onClick={(e) => e.stopPropagation()}>
                      🔗 {note.url}
                    </a>
                  )}
                  {note.sourceType && (
                    <div className="text-[10px] text-muted mt-1">
                      📎 {note.sourceType === 'memo' ? 'メモ' : 'スケジュール'}から
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setEditingNote(null)}>
          <div className="bg-card border border-primary/20 rounded-xl p-5 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-primary mb-3">ノートを編集</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">カテゴリ</label>
                <div className="flex gap-1">
                  {(Object.entries(CATEGORY_STYLES) as [StrategyNoteCategory, typeof CATEGORY_STYLES[StrategyNoteCategory]][]).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => setEditForm((f) => ({ ...f, category: key }))}
                      className={`flex-1 px-2 py-1.5 rounded text-xs border ${editForm.category === key ? `${s.bg} ${s.border} text-primary` : 'border-primary/10 text-muted'}`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">タイトル</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">説明</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">URL（任意）</label>
                <input
                  type="text"
                  value={editForm.url}
                  onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none focus:border-accent-cyan"
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-xs text-muted hover:text-primary">キャンセル</button>
                <button onClick={saveEdit} className="px-4 py-2 text-xs bg-accent-cyan text-black rounded-lg font-medium hover:bg-accent-cyan/80">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
