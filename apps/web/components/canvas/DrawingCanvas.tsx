'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage, Text as KonvaText } from 'react-konva';
import Konva from 'konva';
import { debounce, throttle } from 'lodash';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider';

type Tool = 'brush' | 'eraser' | 'fill' | 'line' | 'trace' | 'pan' | 'text';
type Point2D = { x: number; y: number };
type LineSegment = {
  points: number[];
  color: string;
  size: number;
  tool: Tool;
  id: string;
};
type TextItem = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
};

interface DrawingCanvasProps {
  width: number;
  height: number;
  backgroundImage?: string;
  initialLines?: LineSegment[];
  initialTexts?: TextItem[];
  onSave?: (lines: LineSegment[], imageData: string) => void;
  onStrokeCommitted?: (stroke: LineSegment) => void;
  onArtworkSaved?: (artworkId: string) => void;
  onArtworkExported?: (url: string) => void;
  onArtworkDeleted?: (artworkId: string) => void;
  insideLinesOnly?: boolean;
  className?: string;
  onChange?: (lines: LineSegment[]) => void;
  onColorAction?: (action: 'fill' | 'stroke', color: string) => void;
  onChangeV2?: (payload: { version: 2; lines: LineSegment[]; texts: TextItem[] }) => void;
}

export function DrawingCanvas({
  width,
  height,
  backgroundImage,
  initialLines = [],
  initialTexts = [],
  onSave,
  onStrokeCommitted,
  onArtworkSaved,
  onArtworkExported,
  onArtworkDeleted,
  insideLinesOnly = false,
  className,
  onChange,
  onColorAction,
  onChangeV2,
}: DrawingCanvasProps) {
  const { t } = useI18n();
  const [lines, setLines] = useState<LineSegment[]>(initialLines);
  const [texts, setTexts] = useState<TextItem[]>(initialTexts);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number; value: string } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [color, setColor] = useState('#000000');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInsideLinesOnly, setIsInsideLinesOnly] = useState(insideLinesOnly);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fillOpacity, setFillOpacity] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [askBeforeClear, setAskBeforeClear] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem('lc_canvas_ask_before_clear');
    return v === null ? true : v === '1';
  });
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const curatedSwatches: string[] = [
    // brand
    '#1e90ff', '#5352ed', '#2ed573', '#ffa502', '#ff4757',
    // neutral
    '#000000', '#4b5563', '#9ca3af', '#e5e7eb', '#ffffff',
    // brights
    '#ff7f50', '#ff6b81', '#70a1ff', '#2ecc71', '#f1c40f', '#e67e22'
  ];

  // Load recent colors on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('lc_recent_colors');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setRecentColors(arr.filter((c) => typeof c === 'string'));
        }
      }
    } catch {}
  }, []);

  const pushRecentColor = (c: string) => {
    if (typeof window === 'undefined') return;
    const hex = c.startsWith('#') ? c.toLowerCase() : `#${c.toLowerCase()}`;
    const next = [hex, ...recentColors.filter((x) => x.toLowerCase() !== hex)].slice(0, 8);
    setRecentColors(next);
    try { window.localStorage.setItem('lc_recent_colors', JSON.stringify(next)); } catch {}
  };

  const selectColor = (c: string) => {
    setColor(c);
    pushRecentColor(c);
  };

  // Hotkey help overlay toggles
  useHotkeys('shift+/', (e) => { e.preventDefault(); setShowHelp((v) => !v); }, [setShowHelp]); // '?' key
  useHotkeys('h', (e) => { e.preventDefault(); setShowHelp((v) => !v); }, [setShowHelp]);
  useHotkeys('escape', (e) => { if (showHelp) { e.preventDefault(); setShowHelp(false); } }, [showHelp]);
  const [fillImageVersion, setFillImageVersion] = useState(0);
  const [bgMaskData, setBgMaskData] = useState<ImageData | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const commandStack = useRef<{ commands: any[]; index: number }>({ commands: [], index: -1 });
  const fillCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);
  const [linePreview, setLinePreview] = useState<number[] | null>(null);

  // Load background and mask images
  useEffect(() => {
    if (!backgroundImage) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImage;
    img.onload = () => setImage(img);
    
    // For inside-lines mode, we'd typically have a mask image
    // This would be a black and white image where white areas are paintable
    if (isInsideLinesOnly) {
      const mask = new window.Image();
      mask.crossOrigin = 'anonymous';
      mask.src = `${backgroundImage.replace('.png', '-mask.png')}`;
      mask.onload = () => setMaskImage(mask);
    }
  }, [backgroundImage, isInsideLinesOnly]);

  // Prepare offscreen fill canvas and background mask data
  useEffect(() => {
    if (!width || !height) return;
    // Ensure fill canvas exists and matches stage size
    if (!fillCanvasRef.current) {
      fillCanvasRef.current = document.createElement('canvas');
    }
    const c = fillCanvasRef.current;
    c.width = Math.floor(width);
    c.height = Math.floor(height);
    const ctx = c.getContext('2d');
    if (ctx) {
      // Keep existing fills; do not clear on resize unless size changed
      // If size changes, we reset fills
    }

    // Build background mask data from the template image to detect boundaries
    if (image) {
      const tmp = document.createElement('canvas');
      tmp.width = Math.floor(width);
      tmp.height = Math.floor(height);
      const tctx = tmp.getContext('2d');
      if (tctx) {
        tctx.drawImage(image, 0, 0, tmp.width, tmp.height);
        try {
          const data = tctx.getImageData(0, 0, tmp.width, tmp.height);
          setBgMaskData(data);
        } catch {
          setBgMaskData(null);
        }
      }
    } else {
      setBgMaskData(null);
    }
  }, [width, height, image]);

  // Initialize with empty lines if none provided
  useEffect(() => {
    if (initialLines.length === 0) {
      setLines([]);
    } else {
      setLines(initialLines);
    }
  }, [initialLines]);

  useEffect(() => {
    setTexts(initialTexts ?? []);
  }, [initialTexts]);

  // Notify parent of data changes (for autosave)
  useEffect(() => {
    if (onChange) onChange(lines);
    if (onChangeV2) onChangeV2({ version: 2, lines, texts });
  }, [lines, texts, onChange, onChangeV2]);

  // Handle undo/redo with keyboard shortcuts
  useHotkeys('mod+z', () => handleUndo());
  useHotkeys('mod+shift+z', () => handleRedo());
  useHotkeys('b', () => setCurrentTool('brush'));
  useHotkeys('e', () => setCurrentTool('eraser'));
  useHotkeys('f', () => setCurrentTool('fill'));
  useHotkeys('l', () => setCurrentTool('line'));
  useHotkeys('t', () => setCurrentTool('trace'));
  // Optional: Shift+T to select Text tool
  useHotkeys('shift+t', () => setCurrentTool('text'));
  useHotkeys('h', () => setCurrentTool('pan'));
  useHotkeys(']', () => setBrushSize((prev) => Math.min(100, prev + 1)));
  useHotkeys('[', () => setBrushSize((prev) => Math.max(1, prev - 1)));
  useHotkeys('i', () => setIsInsideLinesOnly((prev) => !prev));

  // Handle drawing start
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (currentTool === 'pan') return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (currentTool === 'line') {
      lineStartRef.current = { x: pos.x, y: pos.y };
      setLinePreview([pos.x, pos.y, pos.x, pos.y]);
      return;
    }

    if (currentTool === 'text') {
      // Create a new text item and open inline editor immediately
      const item: TextItem = {
        id: `text-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        text: t('canvas.text.default') || 'Text',
        color,
        size: Math.max(10, Math.min(96, brushSize * 2)),
      };
      setTexts((prev) => [...prev, item]);
      addCommand({ type: 'addText', item: { ...item } });
      setSelectedTextId(item.id);
      setEditingText({ id: item.id, x: item.x, y: item.y, value: item.text });
      return;
    }

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'trace') {
      setIsDrawing(true);
      const newLine: LineSegment = {
        points: [pos.x, pos.y],
        color: currentTool === 'eraser' ? '#FFFFFF' : color,
        size: brushSize,
        tool: currentTool,
        id: Date.now().toString(),
      };
      setLines((prev) => [...prev, newLine]);
      addCommand({ type: 'add', line: { ...newLine } });
      if (onStrokeCommitted) onStrokeCommitted(newLine);
      return;
    }
  };

  // Throttled drawing function for better performance
  const handleMouseMove = useCallback(
    throttle((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Line preview when dragging in line mode
      if (currentTool === 'line' && lineStartRef.current) {
        setLinePreview([lineStartRef.current.x, lineStartRef.current.y, pointer.x, pointer.y]);
        return;
      }

      if (!isDrawing || currentTool === 'pan' || currentTool === 'fill') return;

      // For inside-lines mode, check if we're drawing in a paintable area
      if (isInsideLinesOnly && maskImage) {
        const pixel = getPixelColor(maskImage, pointer.x, pointer.y);
        if (pixel[3] < 128) return; // Not paintable area
      }

      // Trace tool: only add points near dark outlines from bgMaskData
      if (currentTool === 'trace' && bgMaskData) {
        const x = Math.floor(pointer.x);
        const y = Math.floor(pointer.y);
        if (x < 0 || y < 0 || x >= bgMaskData.width || y >= bgMaskData.height) return;
        const idx = (y * bgMaskData.width + x) * 4;
        const r = bgMaskData.data[idx];
        const g = bgMaskData.data[idx + 1];
        const b = bgMaskData.data[idx + 2];
        const brightness = (r + g + b) / 3;
        if (brightness >= 96) return; // skip if not on line
      }

      setLines((prevLines) => {
        if (prevLines.length === 0) return prevLines;
        const lastLine = prevLines[prevLines.length - 1];
        const newLine = {
          ...lastLine,
          points: lastLine.points.concat([pointer.x, pointer.y]),
        } as LineSegment;
        return [...prevLines.slice(0, -1), newLine];
      });
    }, 16), // ~60fps
    [isDrawing, currentTool, isInsideLinesOnly, maskImage, bgMaskData]
  );

  // Handle drawing end
  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentTool === 'line' && lineStartRef.current && stageRef.current) {
      const pos = stageRef.current.getPointerPosition();
      if (pos) {
        const start = lineStartRef.current;
        const newLine: LineSegment = {
          points: [start.x, start.y, pos.x, pos.y],
          color,
          size: brushSize,
          tool: 'line',
          id: Date.now().toString(),
        };
        setLines((prev) => {
          const updated = [...prev, newLine];
          if (onChange) onChange(updated);
          return updated;
        });
        addCommand({ type: 'add', line: { ...newLine } });
        if (onStrokeCommitted) onStrokeCommitted(newLine);
      }
      lineStartRef.current = null;
      setLinePreview(null);
    }
    // For brush/trace strokes, emit color action when stroke ends
    if ((currentTool === 'brush' || currentTool === 'trace') && onColorAction) {
      onColorAction('stroke', color);
    }
  };

  // Handle fill tool
  const handleFill = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool !== 'fill') return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Flood-fill against the background image mask (treat dark lines as barriers)
    if (!fillCanvasRef.current || !bgMaskData) return;

    const fc = fillCanvasRef.current;
    const fctx = fc.getContext('2d');
    if (!fctx) return;

    const w = fc.width;
    const h = fc.height;
    let imageData: ImageData;
    try {
      imageData = fctx.getImageData(0, 0, w, h);
    } catch {
      return;
    }
    const data = imageData.data;
    const mask = bgMaskData.data; // RGBA

    const startX = Math.floor(pointerPosition.x);
    const startY = Math.floor(pointerPosition.y);
    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

    // Boundary detection threshold: treat pixels with low brightness as outlines
    const isBoundary = (idx: number) => {
      const r = mask[idx], g = mask[idx + 1], b = mask[idx + 2];
      const brightness = (r + g + b) / 3;
      return brightness < 64; // black-ish lines
    };

    const visited = new Uint8Array(w * h);
    const stack: number[] = [];
    stack.push(startY * w + startX);

    // Convert chosen color hex to RGBA
    const hex = color.replace('#', '');
    const rr = parseInt(hex.substring(0, 2), 16) || 0;
    const gg = parseInt(hex.substring(2, 4), 16) || 0;
    const bb = parseInt(hex.substring(4, 6), 16) || 0;
    const aa = 255;

    while (stack.length > 0) {
      const idx1d = stack.pop()!;
      if (visited[idx1d]) continue;
      visited[idx1d] = 1;

      const x = idx1d % w;
      const y = (idx1d / w) | 0;
      const di = idx1d * 4;
      const mi = di;

      // Stop at boundary
      if (isBoundary(mi)) continue;

      // Paint pixel in fill layer
      data[di] = rr;
      data[di + 1] = gg;
      data[di + 2] = bb;
      data[di + 3] = aa;

      // Check neighbors
      if (x > 0) stack.push(idx1d - 1);
      if (x < w - 1) stack.push(idx1d + 1);
      if (y > 0) stack.push(idx1d - w);
      if (y < h - 1) stack.push(idx1d + w);
    }

    // Commit painted region
    try {
      fctx.putImageData(imageData, 0, 0);
      setFillImageVersion((v) => v + 1);
    } catch {}
    // Notify color fill action
    if (onColorAction) {
      onColorAction('fill', color);
    }
  };

  // Clear canvas (lines and fill layer)
  const handleClear = () => {
    const doClear = () => {
      setLines([]);
      // Clear bitmap fill layer
      const fc = fillCanvasRef.current;
      if (fc) {
        const fctx = fc.getContext('2d');
        if (fctx) {
          fctx.clearRect(0, 0, fc.width, fc.height);
          setFillImageVersion((v) => v + 1);
        }
      }
    };

    if (askBeforeClear) {
      const confirmed = window.confirm(t('canvas.toolbar.clear.confirm') || 'Clear the entire canvas?');
      if (!confirmed) return;
    }
    doClear();
  };

  // Handle pan tool
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Calculate new scale with min/max bounds
    const newScale = e.evt.deltaY > 0 
      ? Math.max(0.1, oldScale * 0.9) 
      : Math.min(3, oldScale * 1.1);
    
    // Calculate new position to zoom toward the pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    setScale(newScale);
    setPosition(newPos);
  };

  // Command pattern for undo/redo
  function addCommand(command: any) {
    // Remove any commands after the current index (for redo)
    commandStack.current.commands = commandStack.current.commands.slice(0, commandStack.current.index + 1);
    
    // Add the new command
    commandStack.current.commands.push(command);
    commandStack.current.index = commandStack.current.commands.length - 1;
  };

  function handleUndo() {
    if (commandStack.current.index < 0) return;
    
    const command = commandStack.current.commands[commandStack.current.index];
    if (!command) return;
    
    // Undo the command
    if (command.type === 'add') {
      setLines((prev) => prev.filter((line) => line.id !== command.line.id));
    } else if (command.type === 'addText') {
      setTexts((prev) => prev.filter((t) => t.id !== command.item.id));
    } else if (command.type === 'moveText') {
      setTexts((prev) => prev.map((t) => t.id === command.id ? { ...t, x: command.from.x, y: command.from.y } : t));
    } else if (command.type === 'editText') {
      setTexts((prev) => prev.map((t) => t.id === command.id ? { ...t, text: command.from } : t));
    } else if (command.type === 'styleText') {
      setTexts((prev) => prev.map((t) => t.id === command.id ? { ...t, ...command.from } : t));
    }
    
    commandStack.current.index--;
  };

  function handleRedo() {
    if (commandStack.current.index >= commandStack.current.commands.length - 1) return;
    
    commandStack.current.index++;
    const command = commandStack.current.commands[commandStack.current.index];
    if (!command) return;
    
    // Redo the command
    if (command.type === 'add') {
      setLines((prev) => [...prev, command.line]);
    } else if (command.type === 'addText') {
      setTexts((prev) => [...prev, command.item]);
    } else if (command.type === 'moveText') {
      setTexts((prev) => prev.map((t) => t.id === command.id ? { ...t, x: command.to.x, y: command.to.y } : t));
    } else if (command.type === 'editText') {
      setTexts((prev) => prev.map((t) => t.id === command.id ? { ...t, text: command.to } : t));
    } else if (command.type === 'styleText') {
      setTexts((prev) => prev.map((t) => t.id === command.id ? { ...t, ...command.to } : t));
    }
  };

  // Save artwork
  const handleSave = async () => {
    if (!stageRef.current) return;
    
    // Get the drawing as a data URL
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: 2, // Higher quality for saving
    });
    
    // In a real app, you would save this to your database
    if (onSave) {
      onSave(lines, dataUrl);
    }
    
    // Emit artwork saved event
    if (onArtworkSaved) {
      onArtworkSaved(`artwork-${Date.now()}`);
    }
  };

  // Export artwork as PNG
  const handleExport = async () => {
    if (!stageRef.current) return;
    
    try {
      // In a real app, you would call your Supabase Edge Function here
      const dataUrl = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 3, // High quality for export
      });
      
      // For demo purposes, we'll just create a download link
      const link = document.createElement('a');
      link.download = `artwork-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Emit artwork exported event
      if (onArtworkExported) {
        onArtworkExported(dataUrl);
      }
    } catch (error) {
      console.error('Error exporting artwork:', error);
    }
  };

  // Helper function to get pixel color from an image
  const getPixelColor = (img: HTMLImageElement, x: number, y: number) => {
    // In a real implementation, you would use a canvas to get the pixel color
    // This is a simplified version for demonstration
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [0, 0, 0, 0];
    
    canvas.width = 1;
    canvas.height = 1;
    
    // Scale coordinates based on the image dimensions
    const scaleX = img.width / width;
    const scaleY = img.height / height;
    
    ctx.drawImage(
      img,
      x * scaleX,
      y * scaleY,
      1, 1,
      0, 0,
      1, 1
    );
    
    return ctx.getImageData(0, 0, 1, 1).data;
  };

  return (
    <div ref={containerRef} className={cn('relative select-none', className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
        {/* Modes */}
        <div className="px-1 text-[11px] font-medium text-gray-600">{t('canvas.toolbar.mode')}</div>
        <ToggleGroup 
          type="single" 
          value={currentTool} 
          onValueChange={(value) => setCurrentTool(value as Tool)}
          className="flex-col"
        >
          <ToggleGroupItem value="brush" aria-label={t('canvas.toolbar.mode.draw')} title={`${t('canvas.toolbar.mode.draw')} (B)`}>
            <Icons.brush className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="eraser" aria-label={t('canvas.tools.eraser')} title={`${t('canvas.tools.eraser')} (E)`}>
            <Icons.eraser className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="fill" aria-label={t('canvas.tools.fill')} title={`${t('canvas.tools.fill')} (G)`}>
            <Icons.paintBucket className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="line" aria-label={t('canvas.tools.line')} title={`${t('canvas.tools.line')} (L)`}>
            <Icons.ruler className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="trace" aria-label={t('canvas.tools.trace')} title={`${t('canvas.tools.trace')} (T)`}>
            <Icons.brush className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="text" aria-label={t('canvas.tools.text')} title={t('canvas.tools.text')}>
            <Icons.text className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="pan" aria-label={t('canvas.toolbar.mode.select')} title={`${t('canvas.toolbar.mode.select')} (Space)`}>
            <Icons.hand className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <div className="h-px bg-gray-200 my-1"></div>
        
        <div className="flex flex-col items-center gap-2 p-2">
          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div className="w-full">
              <div className="text-[11px] text-gray-600 mb-1">Recent</div>
              <div className="grid grid-cols-5 gap-1">
                {recentColors.slice(0, 8).map((c) => (
                  <button
                    key={`r-${c}`}
                    className="h-6 rounded border border-gray-300"
                    style={{ backgroundColor: c }}
                    aria-label={`Recent ${c}`}
                    onClick={() => selectColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Curated swatches */}
          <div className="w-full">
            <div className="text-[11px] text-gray-600 mb-1">Swatches</div>
            <div className="grid grid-cols-5 gap-1">
              {curatedSwatches.map((c) => (
                <button
                  key={`c-${c}`}
                  className="h-6 rounded border border-gray-300"
                  style={{ backgroundColor: c }}
                  aria-label={`${t('canvas.toolbar.brush')} ${c}`}
                  onClick={() => selectColor(c)}
                  title={`${t('canvas.toolbar.brush')}: ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Color picker + preview */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={color}
              onChange={(e) => selectColor(e.target.value)}
              aria-label={t('canvas.toolbar.brush')}
              title={t('canvas.toolbar.brush')}
              className="h-8 w-8 p-0 border rounded"
            />
            <div 
              className="w-8 h-8 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
              aria-label={t('canvas.toolbar.brush')}
              title={t('canvas.toolbar.brush')}
            />
          </div>
          
          <div className="text-xs text-center">{t('canvas.toolbar.size')}: {brushSize}px</div>
          <Slider
            value={[brushSize]}
            min={1}
            max={50}
            step={1}
            onValueChange={([value]) => setBrushSize(value)}
            className="w-24"
            orientation="vertical"
          />
          {/* Fill opacity */}
          <div className="text-xs text-center">{t('canvas.toolbar.fill.opacity')}: {Math.round(fillOpacity*100)}%</div>
          <Slider
            value={[Math.round(fillOpacity * 100)]}
            min={0}
            max={100}
            step={5}
            onValueChange={([value]) => setFillOpacity(value/100)}
            className="w-24"
            orientation="vertical"
          />
        </div>
        
        <div className="h-px bg-gray-200 my-1"></div>
        
        <div className="flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleUndo}
            disabled={commandStack.current.index < 0}
            aria-label={t('canvas.undo')}
            title={t('canvas.undo')}
          >
            <Icons.undo className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRedo}
            disabled={commandStack.current.index >= commandStack.current.commands.length - 1}
            aria-label={t('canvas.redo')}
            title={t('canvas.redo')}
          >
            <Icons.redo className="h-5 w-5" />
          </Button>
          
          <Button 
            variant={isInsideLinesOnly ? 'default' : 'ghost'} 
            size="icon" 
            onClick={() => setIsInsideLinesOnly(!isInsideLinesOnly)}
            aria-label={isInsideLinesOnly ? t('canvas.insideLines.disable') : t('canvas.insideLines.enable')}
            title={isInsideLinesOnly ? t('canvas.insideLines.disable') : t('canvas.insideLines.enable')}
          >
            <Icons.insideLines className="h-5 w-5" />
          </Button>
          {/* Grid toggle */}
          <Button 
            variant={showGrid ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setShowGrid((v) => !v)}
            aria-label={t('canvas.toolbar.grid.title')}
            title={`${t('canvas.toolbar.grid.title')}: ${showGrid ? t('canvas.toolbar.grid.on') : t('canvas.toolbar.grid.off')}`}
          >
            <Icons.grid className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              // Reset zoom and position
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            aria-label={t('canvas.resetView')}
            title={t('canvas.resetView')}
          >
            <Icons.zoomOut className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="h-px bg-gray-200 my-1"></div>
        
        <div className="flex flex-col gap-2">
          {/* Clear canvas */}
          <Button 
            variant="destructive"
            onClick={handleClear}
            aria-label={t('canvas.toolbar.clear.button')}
            title={t('canvas.toolbar.clear.title')}
          >
            {t('canvas.toolbar.clear.button')}
          </Button>
          <label className="flex items-center gap-2 text-xs text-gray-700 pl-1">
            <input
              type="checkbox"
              checked={askBeforeClear}
              onChange={(e) => {
                const next = e.target.checked;
                setAskBeforeClear(next);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('lc_canvas_ask_before_clear', next ? '1' : '0');
                }
              }}
            />
            {t('canvas.toolbar.clear.askBefore')}
          </label>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSave}
            aria-label={t('canvas.save')}
            title={t('canvas.save')}
          >
            <Icons.save className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExport}
            aria-label={t('canvas.export')}
            title={t('canvas.export')}
          >
            <Icons.download className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="w-full h-full">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleFill}
          onWheel={handleWheel}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable={currentTool === 'pan'}
          onDragMove={(e) => {
            if (currentTool === 'pan') {
              setPosition({
                x: e.target.x(),
                y: e.target.y(),
              });
            }
          }}
          style={{
            cursor: currentTool === 'pan' ? 'grab' : 'crosshair',
            touchAction: 'none',
          }}
        >
          <Layer ref={layerRef}>
            {/* Background */}
            <Rect width={width} height={height} fill={bgColor} />
            
            {/* Background image */}
            {image && (
              <KonvaImage
                image={image}
                width={width}
                height={height}
                opacity={1}
                listening={false}
              />
            )}

            {/* Filled color layer (bitmap) */}
            {fillCanvasRef.current && (
              <KonvaImage
                image={fillCanvasRef.current}
                width={width}
                height={height}
                listening={false}
                opacity={fillOpacity}
              />
            )}
            
            {/* Drawings */}
          {lines.map((line, i) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.size}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
              tension={0.5}
            />
          ))}

          {/* Text items */}
          {texts.map((tx) => (
            <KonvaText
              key={tx.id}
              x={tx.x}
              y={tx.y}
              text={tx.text}
              fontSize={tx.size}
              fill={tx.color}
              fontStyle={`${tx.bold ? 'bold' : ''} ${tx.italic ? 'italic' : ''}`.trim() || 'normal'}
              align={tx.align ?? 'left'}
              opacity={selectedTextId === tx.id ? 0.92 : 1}
              draggable
              onClick={() => setSelectedTextId(tx.id)}
              onTap={() => setSelectedTextId(tx.id)}
              onDblClick={() => {
                setSelectedTextId(tx.id);
                setEditingText({ id: tx.id, x: tx.x, y: tx.y, value: tx.text });
              }}
              onDragEnd={(e) => {
                const from = { x: tx.x, y: tx.y };
                const to = { x: e.target.x(), y: e.target.y() };
                if (from.x === to.x && from.y === to.y) return;
                setTexts((prev) => prev.map((t) => t.id === tx.id ? { ...t, x: to.x, y: to.y } : t));
                addCommand({ type: 'moveText', id: tx.id, from, to });
              }}
            />
          ))}

            {/* Line preview */}
            {currentTool === 'line' && linePreview && (
              <Line
                points={linePreview}
                stroke={color}
                strokeWidth={brushSize}
                lineCap="round"
                lineJoin="round"
                dash={[8, 8]}
                opacity={0.8}
                listening={false}
              />
            )}
            
            {/* Inside-lines mask (for visual feedback) */}
            {isInsideLinesOnly && maskImage && (
              <KonvaImage
                image={maskImage}
                width={width}
                height={height}
                globalCompositeOperation="destination-in"
                opacity={0.3}
              />
            )}

            {/* Grid overlay */}
            {showGrid && (
              <>
                {/* vertical lines */}
                {Array.from({ length: Math.floor(width / 20) }, (_, i) => (
                  <Line key={`gv-${i}`} points={[i * 20, 0, i * 20, height]} stroke="#e5e7eb" strokeWidth={1} listening={false} />
                ))}
                {/* horizontal lines */}
                {Array.from({ length: Math.floor(height / 20) }, (_, i) => (
                  <Line key={`gh-${i}`} points={[0, i * 20, width, i * 20]} stroke="#e5e7eb" strokeWidth={1} listening={false} />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      </div>
      
      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 px-3 flex justify-between items-center">
        <div>
          {Math.round(scale * 100)}% | {t(`canvas.tools.${currentTool}`)}
          {isInsideLinesOnly && ` | ${t('canvas.insideLines.label')}`}
        </div>
        <div>
          {t('canvas.status.holdSpaceToPan')} | {t('canvas.status.helpHint')} | {width}×{height} | {t('canvas.toolbar.background')}
        </div>
      </div>

      {/* Hotkey Help Overlay */}
      {showHelp && (
        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3 text-sm w-64">
          <div className="font-medium mb-2">{t('canvas.help.title')}</div>
          <ul className="space-y-1">
            <li><span className="font-mono">B</span> — {t('canvas.tools.brush')}</li>
            <li><span className="font-mono">E</span> — {t('canvas.tools.eraser')}</li>
            <li><span className="font-mono">G</span> — {t('canvas.tools.fill')}</li>
            <li><span className="font-mono">L</span> — {t('canvas.tools.line')}</li>
            <li><span className="font-mono">T</span> — {t('canvas.tools.trace')}</li>
            <li><span className="font-mono">Shift+T</span> — {t('canvas.tools.text')}</li>
            <li><span className="font-mono">Space</span> — {t('canvas.tools.pan')}</li>
            <li><span className="font-mono">Ctrl+Z</span> — {t('canvas.undo')}</li>
            <li><span className="font-mono">Ctrl+Y</span> — {t('canvas.redo')}</li>
          </ul>
          <div className="text-xs text-muted-foreground mt-3">{t('canvas.help.closeHint')}</div>
        </div>
      )}

      {/* Inline text editor overlay */}
      {editingText && (
        <textarea
          className="absolute z-30 bg-white/95 backdrop-blur-sm border rounded px-2 py-1 text-sm shadow outline-none"
          ref={(el) => {
            if (!el || !stageRef.current || !containerRef.current) return;
            // Position textarea in screen space accounting for scale and stage position
            const left = editingText.x * scale + position.x;
            const top = editingText.y * scale + position.y;
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
            el.focus();
            el.selectionStart = el.value.length;
          }}
          style={{
            left: 0,
            top: 0,
            transform: 'translate(0,0)',
            width: `${Math.max(100, 8 * (editingText.value.length + 1))}px`,
          }}
          value={editingText.value}
          onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingText(null);
              return;
            }
            if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) || e.key === 'Tab') {
              e.preventDefault();
              const tx = texts.find((t) => t.id === editingText.id);
              if (!tx) { setEditingText(null); return; }
              const prevText = tx.text;
              const next = editingText.value;
              if (next !== prevText) {
                setTexts((prev) => prev.map((t) => t.id === tx.id ? { ...t, text: next } : t));
                addCommand({ type: 'editText', id: tx.id, from: prevText, to: next });
              }
              setEditingText(null);
            }
          }}
          onBlur={() => {
            const tx = texts.find((t) => t.id === editingText.id);
            if (!tx) { setEditingText(null); return; }
            const prevText = tx.text;
            const next = editingText.value;
            if (next !== prevText) {
              setTexts((prev) => prev.map((t) => t.id === tx.id ? { ...t, text: next } : t));
              addCommand({ type: 'editText', id: tx.id, from: prevText, to: next });
            }
            setEditingText(null);
          }}
        />
      )}

      {/* Simple floating typography panel */}
      {selectedTextId && (
        <div className="absolute left-4 top-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow border p-2 flex items-center gap-2 text-sm">
          <div className="opacity-70">{t('canvas.text.panel.title')}</div>
          {/* Size */}
          <label className="flex items-center gap-1">
            <span>{t('canvas.text.size')}</span>
            <input
              type="range"
              min={10}
              max={96}
              step={1}
              value={(texts.find(tx => tx.id === selectedTextId)?.size) ?? 16}
              onChange={(e) => {
                const tx = texts.find(t => t.id === selectedTextId);
                if (!tx) return;
                const to = Number(e.target.value);
                const from = tx.size;
                if (from === to) return;
                setTexts(prev => prev.map(t => t.id === tx.id ? { ...t, size: to } : t));
                addCommand({ type: 'styleText', id: tx.id, from: { size: from }, to: { size: to } });
              }}
            />
          </label>
          {/* Bold */}
          <button
            className="px-2 py-1 border rounded font-bold"
            onClick={() => {
              const tx = texts.find(t => t.id === selectedTextId);
              if (!tx) return;
              const from = { bold: !!tx.bold };
              const to = { bold: !tx.bold };
              setTexts(prev => prev.map(t => t.id === tx.id ? { ...t, ...to } : t));
              addCommand({ type: 'styleText', id: tx.id, from, to });
            }}
            aria-label={t('canvas.text.bold')}
            title={t('canvas.text.bold')}
          >B</button>
          {/* Italic */}
          <button
            className="px-2 py-1 border rounded italic"
            onClick={() => {
              const tx = texts.find(t => t.id === selectedTextId);
              if (!tx) return;
              const from = { italic: !!tx.italic };
              const to = { italic: !tx.italic };
              setTexts(prev => prev.map(t => t.id === tx.id ? { ...t, ...to } : t));
              addCommand({ type: 'styleText', id: tx.id, from, to });
            }}
            aria-label={t('canvas.text.italic')}
            title={t('canvas.text.italic')}
          >I</button>
          {/* Align */}
          <div className="flex items-center gap-1" aria-label={t('canvas.text.align.label')} title={t('canvas.text.align.label')}>
            {(['left','center','right'] as const).map(al => (
              <button
                key={al}
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const tx = texts.find(t => t.id === selectedTextId);
                  if (!tx) return;
                  const from = { align: tx.align ?? 'left' };
                  const to = { align: al };
                  if (from.align === to.align) return;
                  setTexts(prev => prev.map(t => t.id === tx.id ? { ...t, ...to } : t));
                  addCommand({ type: 'styleText', id: tx.id, from, to });
                }}
              >{al.charAt(0).toUpperCase()}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
