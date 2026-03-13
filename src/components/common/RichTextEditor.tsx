'use client';
import { useRef, useEffect, useCallback } from 'react';

const FONT_SIZES = [
  { label: '小', cmd: '1', px: '12px' },
  { label: '中', cmd: '3', px: '14px' },
  { label: '大', cmd: '5', px: '18px' },
];

const FONT_COLORS = [
  { label: '白', hex: '#e2e8f0', cls: 'bg-slate-200' },
  { label: '黄', hex: '#fcd34d', cls: 'bg-amber-300' },
  { label: '赤', hex: '#f87171', cls: 'bg-red-400' },
  { label: '緑', hex: '#34d399', cls: 'bg-emerald-400' },
  { label: '青', hex: '#22d3ee', cls: 'bg-cyan-400' },
];

const ACCENT_STYLES = {
  amber: { border: 'focus-within:border-amber-400/50' },
  cyan: { border: 'focus-within:border-accent-cyan/50' },
  gold: { border: 'focus-within:border-accent-gold/50' },
};

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

function applyFontSize(cmdSize: string, pxSize: string) {
  execCmd('fontSize', cmdSize);
  const fonts = document.querySelectorAll(`font[size="${cmdSize}"]`);
  fonts.forEach((font) => {
    const span = document.createElement('span');
    span.style.fontSize = pxSize;
    span.innerHTML = font.innerHTML;
    font.parentNode?.replaceChild(span, font);
  });
}

interface ToolbarButtonProps {
  onAction: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ToolbarButton({ onAction, title, children, className = '' }: ToolbarButtonProps) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onAction(); }}
      className={`p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  accentColor?: 'amber' | 'cyan' | 'gold';
}

export function RichTextEditor({ value, onChange, onBlur, placeholder, minHeight = '80px', className = '', accentColor = 'cyan' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const accent = ACCENT_STYLES[accentColor];

  useEffect(() => {
    if (editorRef.current && !initializedRef.current) {
      editorRef.current.innerHTML = value || '';
      initializedRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editorRef.current && initializedRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd+B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      execCmd('bold');
      handleInput();
    }
    // Ctrl/Cmd+I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      execCmd('italic');
      handleInput();
    }
  }, [handleInput]);

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-1 flex-wrap">
        {/* Format buttons */}
        <ToolbarButton onAction={() => { execCmd('bold'); handleInput(); }} title="太字 (Ctrl+B)">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
        </ToolbarButton>
        <ToolbarButton onAction={() => { execCmd('italic'); handleInput(); }} title="斜体 (Ctrl+I)">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
        </ToolbarButton>
        <ToolbarButton onAction={() => { execCmd('insertUnorderedList'); handleInput(); }} title="箇条書き">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </ToolbarButton>

        <div className="h-3 w-px bg-border mx-0.5" />

        {/* Font sizes */}
        <div className="flex gap-0.5">
          {FONT_SIZES.map((s) => (
            <button key={s.label}
              onMouseDown={(e) => { e.preventDefault(); applyFontSize(s.cmd, s.px); handleInput(); }}
              className="px-1.5 py-0.5 rounded text-[10px] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              title={`フォントサイズ: ${s.label}`}
            >{s.label}</button>
          ))}
        </div>

        <div className="h-3 w-px bg-border mx-0.5" />

        {/* Font colors */}
        <div className="flex gap-1">
          {FONT_COLORS.map((c) => (
            <button key={c.hex}
              onMouseDown={(e) => { e.preventDefault(); execCmd('foreColor', c.hex); handleInput(); }}
              className={`w-3.5 h-3.5 rounded-full ${c.cls} opacity-50 hover:opacity-100 transition-opacity`}
              title={c.label}
            />
          ))}
        </div>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={`w-full px-3 py-2 bg-bg-primary/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none ${accent.border}`}
        style={{ minHeight, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
