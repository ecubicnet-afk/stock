import { useRef, useEffect, useState, useCallback } from 'react';
import type { StrategyDrawing, DrawingPath, DrawingText } from '../../types';

export type DrawingTool = 'pen' | 'eraser' | 'strokeEraser' | 'text';

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

// Distance from point to line segment
function distToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

// Find path ID near a given point
function findPathAtPoint(paths: DrawingPath[], px: number, py: number, threshold = 10): string | null {
  // Search in reverse order (topmost first)
  for (let i = paths.length - 1; i >= 0; i--) {
    const path = paths[i];
    if (path.isEraser) continue; // skip eraser strokes
    for (let j = 0; j < path.points.length - 1; j++) {
      if (distToSegment({ x: px, y: py }, path.points[j], path.points[j + 1]) <= threshold + path.width / 2) {
        return path.id;
      }
    }
  }
  return null;
}

// Find text ID near a given point
function findTextAtPoint(texts: DrawingText[], px: number, py: number): string | null {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    const approxWidth = t.text.length * t.fontSize * 0.6;
    if (px >= t.x && px <= t.x + approxWidth && py >= t.y - t.fontSize && py <= t.y + 4) {
      return t.id;
    }
  }
  return null;
}

export function DrawingLayer({
  width, height, drawing, onUpdateDrawing,
  activeTool, toolColor, toolWidth, toolFontSize,
}: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const erasedIdsRef = useRef<Set<string>>(new Set());
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [highlightPathId, setHighlightPathId] = useState<string | null>(null);

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

      // Highlight stroke about to be erased
      if (highlightPathId === path.id) {
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = path.width + 2;
        ctx.setLineDash([6, 4]);
      }

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
      if (highlightPathId === t.id) {
        ctx.fillStyle = '#ff6666';
      } else {
        ctx.fillStyle = t.color;
      }
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }, [drawing, width, height, highlightPathId]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!activeTool) return;

    if (activeTool === 'text') {
      const pos = getCanvasPos(e);
      setTextInput({ x: pos.x, y: pos.y, value: '' });
      return;
    }

    if (activeTool === 'strokeEraser') {
      const pos = getCanvasPos(e);
      // Try to find and remove a path or text at this point
      const pathId = findPathAtPoint(drawing.paths, pos.x, pos.y);
      if (pathId) {
        erasedIdsRef.current.add(pathId);
        onUpdateDrawing({
          ...drawing,
          paths: drawing.paths.filter((p) => !erasedIdsRef.current.has(p.id)),
        });
        erasedIdsRef.current.clear();
        setHighlightPathId(null);
        return;
      }
      const textId = findTextAtPoint(drawing.texts, pos.x, pos.y);
      if (textId) {
        onUpdateDrawing({
          ...drawing,
          texts: drawing.texts.filter((t) => t.id !== textId),
        });
        setHighlightPathId(null);
        return;
      }
      // Start drag-erase mode
      isDrawingRef.current = true;
      erasedIdsRef.current = new Set();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // pen or freehand eraser
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    currentPathRef.current = [pos];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [activeTool, getCanvasPos, drawing, onUpdateDrawing]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!activeTool) return;

    const pos = getCanvasPos(e);

    // Stroke eraser: highlight path under cursor, or drag-erase
    if (activeTool === 'strokeEraser') {
      if (isDrawingRef.current) {
        // Drag-erase: remove any paths touched during drag
        const pathId = findPathAtPoint(drawing.paths, pos.x, pos.y);
        if (pathId && !erasedIdsRef.current.has(pathId)) {
          erasedIdsRef.current.add(pathId);
          onUpdateDrawing({
            ...drawing,
            paths: drawing.paths.filter((p) => !erasedIdsRef.current.has(p.id)),
          });
        }
        const textId = findTextAtPoint(drawing.texts, pos.x, pos.y);
        if (textId) {
          onUpdateDrawing({
            ...drawing,
            texts: drawing.texts.filter((t) => t.id !== textId),
          });
        }
      } else {
        // Hover highlight
        const pathId = findPathAtPoint(drawing.paths, pos.x, pos.y);
        const textId = !pathId ? findTextAtPoint(drawing.texts, pos.x, pos.y) : null;
        setHighlightPathId(pathId || textId);
      }
      return;
    }

    if (!isDrawingRef.current || activeTool === 'text') return;
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
  }, [activeTool, toolColor, toolWidth, getCanvasPos, drawing, onUpdateDrawing]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;

    if (activeTool === 'strokeEraser') {
      isDrawingRef.current = false;
      erasedIdsRef.current = new Set();
      return;
    }

    if (!activeTool || activeTool === 'text') return;
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
      y: textInput.y + toolFontSize, // y is baseline for fillText
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
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  }, [textInput]);

  // Clear highlight when tool changes
  useEffect(() => {
    if (activeTool !== 'strokeEraser') setHighlightPathId(null);
  }, [activeTool]);

  const isTextInputActive = !!textInput;

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{
          pointerEvents: activeTool && !isTextInputActive ? 'auto' : 'none',
          cursor: activeTool === 'text' ? 'text' : activeTool === 'strokeEraser' ? (highlightPathId ? 'pointer' : 'crosshair') : activeTool ? 'crosshair' : 'default',
        }}
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
          className="absolute border border-accent-cyan/50 text-white px-1 focus:outline-none rounded"
          style={{
            left: textInput.x,
            top: textInput.y - 4,
            fontSize: toolFontSize,
            fontFamily: 'sans-serif',
            minWidth: 120,
            zIndex: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            pointerEvents: 'auto',
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
