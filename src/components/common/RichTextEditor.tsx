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
  amber: { active: 'bg-amber-500/20 text-amber-300', border: 'focus-within:border-amber-400/50' },
  cyan: { active: 'bg-accent-cyan/20 text-accent-cyan', border: 'focus-within:border-accent-cyan/50' },
  gold: { active: 'bg-accent-gold/20 text-accent-gold', border: 'focus-within:border-accent-gold/50' },
};

function applyFontSize(cmdSize: string, pxSize: string) {
  document.execCommand('fontSize', false, cmdSize);
  const fonts = document.querySelectorAll(`font[size="${cmdSize}"]`);
  fonts.forEach((font) => {
    const span = document.createElement('span');
    span.style.fontSize = pxSize;
    span.innerHTML = font.innerHTML;
    font.parentNode?.replaceChild(span, font);
  });
}

function applyFontColor(hex: string) {
  document.execCommand('foreColor', false, hex);
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

  // Sync external value changes (e.g. when switching entries)
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

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="flex gap-0.5">
          {FONT_SIZES.map((s) => (
            <button key={s.label}
              onMouseDown={(e) => { e.preventDefault(); applyFontSize(s.cmd, s.px); handleInput(); }}
              className={`px-1.5 py-0.5 rounded text-[10px] text-muted hover:text-primary hover:bg-primary/10`}
              title={`フォントサイズ: ${s.label}`}
            >{s.label}</button>
          ))}
        </div>
        <div className="h-3 w-px bg-primary/20" />
        <div className="flex gap-1">
          {FONT_COLORS.map((c) => (
            <button key={c.hex}
              onMouseDown={(e) => { e.preventDefault(); applyFontColor(c.hex); handleInput(); }}
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
        onBlur={onBlur}
        className={`w-full px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary focus:outline-none ${accent.border}`}
        style={{ minHeight, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
