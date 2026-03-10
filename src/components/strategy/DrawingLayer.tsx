import { useRef, useEffect, useState, useCallback } from 'react';
import type { StrategyDrawing, DrawingPath, DrawingText } from '../../types';

export type DrawingTool = 'pen' | 'eraser' | 'text';

interface DrawingLayerProps {
  width: number;
  height: number;
  drawing: StrategyDrawing;
  onUpdateDrawing: (drawing: StrategyDrawing) => void;
  activeTool: DrawingTool | null;
  toolColor: string;
  toolWidth: number;
  toolFontSize: number;
}

export function DrawingLayer({
  width, height, drawing, onUpdateDrawing,
  activeTool, toolColor, toolWidth, toolFontSize,
}: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Redraw all persisted paths and texts
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (const path of drawing.paths) {
      if (path.points.length < 2) continue;
      ctx.save();
      if (path.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      }
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    for (const t of drawing.texts) {
      ctx.save();
      ctx.font = `${t.fontSize}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }, [drawing, width, height]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scrollEl = canvas.parentElement;
    const scrollLeft = scrollEl?.scrollLeft ?? 0;
    const scrollTop = scrollEl?.scrollTop ?? 0;
    return {
      x: e.clientX - rect.left + scrollLeft,
      y: e.clientY - rect.top + scrollTop,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!activeTool) return;

    if (activeTool === 'text') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTextInput({ x, y, value: '' });
      return;
    }

    // pen or eraser
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    currentPathRef.current = [pos];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [activeTool, getCanvasPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current || !activeTool || activeTool === 'text') return;
    const pos = getCanvasPos(e);
    currentPathRef.current.push(pos);

    // Draw current stroke in real-time
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const points = currentPathRef.current;
    if (points.length < 2) return;

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.strokeStyle = toolColor;
    ctx.lineWidth = activeTool === 'eraser' ? toolWidth * 3 : toolWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
    ctx.restore();
  }, [activeTool, toolColor, toolWidth, getCanvasPos]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !activeTool || activeTool === 'text') return;
    isDrawingRef.current = false;
    const points = currentPathRef.current;
    if (points.length < 2) return;

    const newPath: DrawingPath = {
      id: crypto.randomUUID(),
      points: simplifyPath(points),
      color: toolColor,
      width: activeTool === 'eraser' ? toolWidth * 3 : toolWidth,
      isEraser: activeTool === 'eraser' || undefined,
    };
    onUpdateDrawing({
      ...drawing,
      paths: [...drawing.paths, newPath],
    });
    currentPathRef.current = [];
  }, [activeTool, toolColor, toolWidth, drawing, onUpdateDrawing]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    const newText: DrawingText = {
      id: crypto.randomUUID(),
      x: textInput.x,
      y: textInput.y,
      text: textInput.value,
      color: toolColor,
      fontSize: toolFontSize,
    };
    onUpdateDrawing({
      ...drawing,
      texts: [...drawing.texts, newText],
    });
    setTextInput(null);
  }, [textInput, toolColor, toolFontSize, drawing, onUpdateDrawing]);

  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ pointerEvents: activeTool ? 'auto' : 'none', cursor: activeTool === 'text' ? 'text' : activeTool ? 'crosshair' : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {textInput && (
        <input
          ref={textInputRef}
          type="text"
          value={textInput.value}
          onChange={(e) => setTextInput((prev) => prev ? { ...prev, value: e.target.value } : null)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setTextInput(null); }}
          onBlur={handleTextSubmit}
          className="absolute bg-transparent border border-accent-cyan/50 text-white px-1 focus:outline-none"
          style={{
            left: textInput.x,
            top: textInput.y - toolFontSize,
            fontSize: toolFontSize,
            minWidth: 100,
          }}
        />
      )}
    </>
  );
}

// Simplify path by removing redundant points (Ramer-Douglas-Peucker)
function simplifyPath(points: { x: number; y: number }[], epsilon = 1.5): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDist(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  return Math.abs(dx * (a.y - p.y) - dy * (a.x - p.x)) / len;
}
