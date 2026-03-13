'use client';
import { useState } from 'react';
import { useSidebarTodos, useSidebarPrinciples } from '../../hooks/useSidebarNotes';

export function SidebarTodos() {
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

  return (
    <>
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
    </>
  );
}
