"use client";

import React, { useEffect, useMemo, useRef } from "react";

type ChangePayloadV2 = {
  version: 2;
  lines: any[];
  texts: any[];
};

type Props = {
  width: number;
  height: number;
  className?: string;
  initialLines?: any[];
  initialTexts?: any[];
  backgroundImage?: string | null;
  backgroundOpacity?: number; // 0..1
  mode?: 'draw' | 'select';
  onSelectionChange?: (rect: { x: number; y: number; w: number; h: number } | null) => void;
  fillSelectionCommand?: number; // increment to trigger fill
  fillOpacity?: number; // 0..1
  clearCommand?: number; // increment to clear canvas/lines
  undoCommand?: number; // increment to trigger undo
  redoCommand?: number; // increment to trigger redo
  showGrid?: boolean; // toggles grid rendering
  brushColor?: string;
  brushSize?: number;
  onColorAction?: (action: string, color?: string) => void;
  onChangeV2?: (payload: ChangePayloadV2) => void;
  onSave?: (lines: any[], imageDataUrl: string) => void;
};

export const DrawingCanvas: React.FC<Props> = ({
  width,
  height,
  className,
  initialLines = [],
  initialTexts = [],
  backgroundImage,
  backgroundOpacity,
  mode = 'draw',
  onSelectionChange,
  fillSelectionCommand,
  fillOpacity = 1,
  clearCommand,
  undoCommand,
  redoCommand,
  showGrid = false,
  brushColor,
  brushSize,
  onChangeV2,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bg = useMemo(() => backgroundImage ?? undefined, [backgroundImage]);
  const linesRef = useRef<any[]>([]);
  const isDrawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const pendingRedrawRef = useRef(false);
  const pendingClearRef = useRef(false);
  const pendingUndoRef = useRef(false);
  const pendingRedoRef = useRef(false);
  const brushRef = useRef<{ color: string; size: number }>({ color: "#ffffff", size: 4 });
  const pendingResizeRef = useRef<{ w: number; h: number } | null>(null);
  // History stacks: array of snapshots of lines
  const historyRef = useRef<any[][]>([]);
  const redoStackRef = useRef<any[][]>([]);
  const historyInitializedRef = useRef(false);
  const bgOpacity = useMemo(() => {
    const v = typeof backgroundOpacity === 'number' ? backgroundOpacity : 1;
    return Math.max(0, Math.min(1, v));
  }, [backgroundOpacity]);
  const fillOpacityClamped = useMemo(() => {
    const v = typeof fillOpacity === 'number' ? fillOpacity : 1;
    return Math.max(0, Math.min(1, v));
  }, [fillOpacity]);
  const selectionRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Keep brush in sync with props
  useEffect(() => {
    if (typeof brushColor === 'string' && brushColor) {
      brushRef.current.color = brushColor;
    }
  }, [brushColor]);
  useEffect(() => {
    if (typeof brushSize === 'number' && brushSize > 0) {
      brushRef.current.size = brushSize;
    }
  }, [brushSize]);

  // Draw a very basic background and any initial content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Do not redraw while actively drawing/dragging; defer
    if (isDrawingRef.current) {
      pendingRedrawRef.current = true;
      return;
    }
    // Avoid resetting the bitmap while drawing; defer size changes
    if (canvas.width !== width || canvas.height !== height) {
      if (isDrawingRef.current) {
        pendingResizeRef.current = { w: width, h: height };
      } else {
        canvas.width = width;
        canvas.height = height;
      }
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = "#111827"; // Tailwind slate-900
    ctx.fillRect(0, 0, width, height);

    // Optional background image (preserve aspect ratio; do not stretch)
    if (bg) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          if (iw > 0 && ih > 0) {
            // Contain within canvas while preserving aspect ratio
            const scale = Math.min(width / iw, height / ih);
            const dw = Math.round(iw * scale);
            const dh = Math.round(ih * scale);
            const dx = Math.floor((width - dw) / 2);
            const dy = Math.floor((height - dh) / 2);
            ctx.save();
            ctx.globalAlpha = bgOpacity;
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
          } else {
            // Fallback just in case browser couldn't read image dimensions
            ctx.save();
            ctx.globalAlpha = bgOpacity;
            ctx.drawImage(img, 0, 0);
            ctx.restore();
          }
        } catch {
          // Ignore drawing errors to avoid crashing the render
        }
      };
      img.src = bg;
    }

    // Render grid only when explicitly toggled on
    if (showGrid) {
      ctx.strokeStyle = "#374151"; // slate-700
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
    }

    // Render initial text items as plain labels
    ctx.fillStyle = "#9CA3AF"; // slate-400
    initialTexts.forEach((t: any, i: number) => {
      const tx = typeof t?.x === "number" ? t.x : 12;
      const ty = typeof t?.y === "number" ? t.y : 24 + i * 20;
      const content = typeof t?.text === "string" ? t.text : `Text ${i + 1}`;
      ctx.fillText(content, tx, ty);
    });

    // Initialize lines from initialLines only once (do NOT clobber existing strokes on prop changes)
    let didInitFromProps = false;
    if (linesRef.current.length === 0 && Array.isArray(initialLines) && initialLines.length > 0) {
      linesRef.current = [...initialLines];
      didInitFromProps = true;
    }

    // Replay current lines
    try {
      for (const line of linesRef.current) {
        const color = line?.color || "#ffffff";
        const size = typeof line?.size === "number" ? line.size : 4;
        const pts: number[] = Array.isArray(line?.points) ? line.points : [];
        if (pts.length >= 2) {
          ctx.strokeStyle = color;
          ctx.lineWidth = size;
          ctx.lineJoin = ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) {
            ctx.lineTo(pts[i], pts[i + 1]);
          }
          ctx.stroke();
        }
      }
    } catch {}

    // Notify change with a minimal payload
    onChangeV2?.({ version: 2, lines: initialLines ?? [], texts: initialTexts ?? [] });

    // Initialize history once with current state so first undo works after first change
    if (!historyInitializedRef.current) {
      historyRef.current = [JSON.parse(JSON.stringify(linesRef.current))];
      redoStackRef.current = [];
      historyInitializedRef.current = true;
    }
  }, [width, height, bg, initialLines, initialTexts, bgOpacity]);

  // Redraw everything (bg image, grid, texts, lines, selection overlay) when deps change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const redraw = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Fill bg
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const drawGrid = () => {
        if (!showGrid) return;
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x + 0.5, 0);
          ctx.lineTo(x + 0.5, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(canvas.width, y + 0.5);
          ctx.stroke();
        }
      };
      const drawTexts = () => {
        ctx.fillStyle = "#9CA3AF";
        initialTexts.forEach((t: any, i: number) => {
          const tx = typeof t?.x === 'number' ? t.x : 12;
          const ty = typeof t?.y === 'number' ? t.y : 24 + i * 20;
          const content = typeof t?.text === 'string' ? t.text : `Text ${i + 1}`;
          ctx.fillText(content, tx, ty);
        });
      };
      const drawLines = () => {
        try {
          for (const line of linesRef.current) {
            const color = line?.color || '#ffffff';
            if (line?.type === 'fill' && line?.rect) {
              const r = line.rect;
              const op = typeof line.opacity === 'number' ? Math.max(0, Math.min(1, line.opacity)) : 1;
              ctx.save();
              ctx.beginPath();
              ctx.rect(r.x, r.y, r.w, r.h);
              ctx.clip();
              ctx.globalAlpha = op;
              ctx.fillStyle = color;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.restore();
              continue;
            }
            const size = typeof line?.size === 'number' ? line.size : 4;
            const pts: number[] = Array.isArray(line?.points) ? line.points : [];
            if (pts.length >= 2) {
              ctx.strokeStyle = color;
              ctx.lineWidth = size;
              ctx.lineJoin = ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(pts[0], pts[1]);
              for (let i = 2; i < pts.length; i += 2) {
                ctx.lineTo(pts[i], pts[i + 1]);
              }
              ctx.stroke();
            }
          }
        } catch {}
      };

      if (bg) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (iw > 0 && ih > 0) {
              const scale = Math.min(canvas.width / iw, canvas.height / ih);
              const dw = Math.round(iw * scale);
              const dh = Math.round(ih * scale);
              const dx = Math.floor((canvas.width - dw) / 2);
              const dy = Math.floor((canvas.height - dh) / 2);
              ctx.save();
              ctx.globalAlpha = bgOpacity;
              ctx.drawImage(img, dx, dy, dw, dh);
              ctx.restore();
            } else {
              ctx.save();
              ctx.globalAlpha = bgOpacity;
              ctx.drawImage(img, 0, 0);
              ctx.restore();
            }
          } catch {}
          // Do not draw grid when a background image is present to avoid covering the template
          drawTexts();
          drawLines();
          // Selection overlay
          const sel = selectionRef.current;
          if (sel) {
            ctx.save();
            ctx.strokeStyle = '#60A5FA';
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 1;
            ctx.strokeRect(sel.x + 0.5, sel.y + 0.5, sel.w, sel.h);
            ctx.restore();
          }
        };
        img.src = bg;
      } else {
        drawGrid();
        drawTexts();
        drawLines();
        const sel = selectionRef.current;
        if (sel) {
          ctx.save();
          ctx.strokeStyle = '#60A5FA';
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 1;
          ctx.strokeRect(sel.x + 0.5, sel.y + 0.5, sel.w, sel.h);
          ctx.restore();
        }
      }
    };
    redraw();
    const handler = () => {
      // Defer ALL redraws while drawing (any mode) to guarantee no accidental wipe.
      if (isDrawingRef.current) {
        pendingRedrawRef.current = true;
        return;
      }
      redraw();
    };
    window.addEventListener('redraw', handler as any);
    window.addEventListener('bg-opacity-change', handler as any);
    return () => {
      window.removeEventListener('redraw', handler as any);
      window.removeEventListener('bg-opacity-change', handler as any);
    };
  }, [bg, bgOpacity, initialTexts, mode, showGrid]);

  // Basic freehand drawing and selection mode with mouse/touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
        const t = (e as TouchEvent).touches[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      }
      const m = e as MouseEvent;
      return { x: m.clientX - rect.left, y: m.clientY - rect.top };
    };

    const begin = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      if (mode === 'select') {
        isDrawingRef.current = true;
        selectionRef.current = { x, y, w: 0, h: 0 };
        onSelectionChange?.(selectionRef.current);
        // Soft redraw to show selection rectangle
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => {
            const evt = new Event('redraw');
            window.dispatchEvent(evt);
          });
        } else {
          setTimeout(() => {
            const evt = new Event('redraw');
            window.dispatchEvent(evt);
          }, 0);
        }
        return;
      }
      // draw mode
      isDrawingRef.current = true;
      lastRef.current = { x, y };
      // Start a new stroke line
      linesRef.current.push({ type: 'stroke', color: brushRef.current.color, size: brushRef.current.size, points: [x, y] });
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      if (mode === 'select') {
        const start = selectionRef.current;
        if (!start) return;
        const nx = Math.min(start.x, x);
        const ny = Math.min(start.y, y);
        const nw = Math.abs(x - start.x);
        const nh = Math.abs(y - start.y);
        selectionRef.current = { x: nx, y: ny, w: nw, h: nh };
        onSelectionChange?.(selectionRef.current);
        // Redraw to show selection box (safe during selection)
        const evt = new Event('redraw');
        window.dispatchEvent(evt);
        return;
      }
      const last = lastRef.current;
      if (!last) return;
      // Use current line's captured style to keep stroke consistent even if user changes brush mid-stroke
      const current = linesRef.current[linesRef.current.length - 1];
      const strokeColor = current?.color || brushRef.current.color;
      const strokeSize = typeof current?.size === 'number' ? current.size : brushRef.current.size;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastRef.current = { x, y };
      // Append points to current line
      if (current && Array.isArray(current.points)) {
        current.points.push(x, y);
      }
    };

    const end = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      // If a resize was deferred during interaction, apply it now and force redraw
      const pendingSize = pendingResizeRef.current;
      if (pendingSize && canvasRef.current) {
        pendingResizeRef.current = null;
        const c = canvasRef.current;
        c.width = pendingSize.w;
        c.height = pendingSize.h;
      }
      if (mode === 'select') {
        // Keep selection; no change to lines
        const evt = new Event('redraw');
        window.dispatchEvent(evt);
        // If a redraw was requested during selection drag, do it now
        if (pendingRedrawRef.current) {
          pendingRedrawRef.current = false;
          const evt2 = new Event('redraw');
          window.dispatchEvent(evt2);
        }
        // If a clear was requested during selection, perform it now
        if (pendingClearRef.current) {
          pendingClearRef.current = false;
          linesRef.current = [];
          selectionRef.current = null;
          onSelectionChange?.(null);
          onChangeV2?.({ version: 2, lines: linesRef.current, texts: initialTexts ?? [] });
          const ev = new Event('redraw');
          window.dispatchEvent(ev);
          // Record clear into history so it can be undone
          pushHistory();
        }
        // If an undo/redo was requested during selection, perform now
        if (pendingUndoRef.current) {
          pendingUndoRef.current = false;
          performUndo();
        }
        if (pendingRedoRef.current) {
          pendingRedoRef.current = false;
          performRedo();
        }
      } else {
        lastRef.current = null;
        // Report change
        onChangeV2?.({ version: 2, lines: linesRef.current, texts: initialTexts ?? [] });
        // Push history snapshot after completing a stroke
        pushHistory();
        // If a redraw was requested during drawing, do it now
        if (pendingRedrawRef.current) {
          pendingRedrawRef.current = false;
          const evt = new Event('redraw');
          window.dispatchEvent(evt);
        }
        // If a clear was requested during stroke, perform it now
        if (pendingClearRef.current) {
          pendingClearRef.current = false;
          linesRef.current = [];
          selectionRef.current = null;
          onSelectionChange?.(null);
          onChangeV2?.({ version: 2, lines: linesRef.current, texts: initialTexts ?? [] });
          const ev = new Event('redraw');
          window.dispatchEvent(ev);
          // Push clear to history so it can be undone
          pushHistory();
        }
        // If undo/redo was requested during stroke, perform it now
        if (pendingUndoRef.current) {
          pendingUndoRef.current = false;
          performUndo();
        }
        if (pendingRedoRef.current) {
          pendingRedoRef.current = false;
          performRedo();
        }
        // After freehand end, if we applied a pending resize, request a redraw
        if (pendingSize) {
          const ev2 = new Event('redraw');
          window.dispatchEvent(ev2);
        }
      }
    };

    canvas.addEventListener("mousedown", begin);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", begin, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", begin);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", begin as any);
      canvas.removeEventListener("touchmove", move as any);
      window.removeEventListener("touchend", end);
    };
  }, [onChangeV2, initialTexts, mode, onSelectionChange]);

  // Clear tool: only explicit clearCommand can wipe, and if drawing, defer until end
  useEffect(() => {
    if (!clearCommand) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isDrawingRef.current) {
      pendingClearRef.current = true;
      return;
    }
    // Perform clear immediately
    linesRef.current = [];
    selectionRef.current = null;
    onSelectionChange?.(null);
    onChangeV2?.({ version: 2, lines: linesRef.current, texts: initialTexts ?? [] });
    const evt = new Event('redraw');
    window.dispatchEvent(evt);
    // Record clear into history and invalidate redo stack
    pushHistory();
  }, [clearCommand, onChangeV2, initialTexts, onSelectionChange]);

  // Fill selection when commanded
  useEffect(() => {
    if (!fillSelectionCommand) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sel = selectionRef.current;
    if (!sel || sel.w <= 0 || sel.h <= 0) return;
    // Apply fill clipped to selection rect
    ctx.save();
    ctx.beginPath();
    ctx.rect(sel.x, sel.y, sel.w, sel.h);
    ctx.clip();
    ctx.globalAlpha = fillOpacityClamped;
    ctx.fillStyle = brushRef.current.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    // Persist as a fill operation in lines so it replays and can be saved logically
    linesRef.current.push({ type: 'fill', color: brushRef.current.color, opacity: fillOpacityClamped, rect: { ...sel } });
    onChangeV2?.({ version: 2, lines: linesRef.current, texts: initialTexts ?? [] });
    pushHistory();
  }, [fillSelectionCommand, fillOpacityClamped, initialTexts]);

  // Undo/Redo command handlers (defer during drawing/selection)
  useEffect(() => {
    if (!undoCommand) return;
    if (isDrawingRef.current) {
      pendingUndoRef.current = true;
      return;
    }
    performUndo();
  }, [undoCommand]);

  useEffect(() => {
    if (!redoCommand) return;
    if (isDrawingRef.current) {
      pendingRedoRef.current = true;
      return;
    }
    performRedo();
  }, [redoCommand]);

  // Helpers: snapshot management
  const pushHistory = () => {
    try {
      const snapshot = JSON.parse(JSON.stringify(linesRef.current));
      // If history not initialized yet, do it now
      if (!historyInitializedRef.current) {
        historyRef.current = [snapshot];
        redoStackRef.current = [];
        historyInitializedRef.current = true;
        return;
      }
      historyRef.current.push(snapshot);
      // Any new action invalidates redo stack
      redoStackRef.current = [];
    } catch {}
  };

  const applyLines = (next: any[]) => {
    linesRef.current = next;
    selectionRef.current = null;
    onSelectionChange?.(null);
    onChangeV2?.({ version: 2, lines: linesRef.current, texts: initialTexts ?? [] });
    const evt = new Event('redraw');
    window.dispatchEvent(evt);
  };

  const performUndo = () => {
    try {
      // Need at least two states to move back: current + previous
      if (!historyInitializedRef.current || historyRef.current.length <= 1) return;
      const current = historyRef.current.pop();
      if (!current) return;
      // Push current to redo stack
      redoStackRef.current.push(current);
      const previous = historyRef.current[historyRef.current.length - 1] ?? [];
      applyLines(JSON.parse(JSON.stringify(previous)));
    } catch {}
  };

  const performRedo = () => {
    try {
      if (!historyInitializedRef.current || redoStackRef.current.length === 0) return;
      const next = redoStackRef.current.pop();
      if (!next) return;
      // Applying redo should also push back into history as the new current state
      applyLines(JSON.parse(JSON.stringify(next)));
      historyRef.current.push(JSON.parse(JSON.stringify(next)));
    } catch {}
  };

  // Expose a simple Ctrl+S to trigger save if consumer provided onSave
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas || !onSave) return;
        const dataUrl = canvas.toDataURL("image/png");
        onSave(linesRef.current ?? [], dataUrl);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave, initialLines]);

  return (
    <div className={className} style={{ width, height }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
};
