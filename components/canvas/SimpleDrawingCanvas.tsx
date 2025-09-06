'use client';

import React, { useEffect, useRef, useState } from 'react';

type Line = {
  points: number[];
  color: string;
  brushSize: number;
};

type SimpleDrawingCanvasProps = {
  width: number;
  height: number;
  initialLines?: Line[];
  initialTexts?: any[];
  onSave?: (lines: Line[]) => void;
  readOnly?: boolean;
};

export const SimpleDrawingCanvas: React.FC<SimpleDrawingCanvasProps> = ({
  width,
  height,
  initialLines = [],
  initialTexts = [],
  onSave,
  readOnly = false,
}) => {
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw all lines
    [...lines, ...(currentLine ? [currentLine] : [])].forEach(line => {
      if (line.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(line.points[0], line.points[1]);
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i], line.points[i + 1]);
      }
      ctx.stroke();
    });
  }, [lines, currentLine, width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentLine({
      points: [x, y],
      color: brushColor,
      brushSize,
    });
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLine || readOnly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentLine({
      ...currentLine,
      points: [...currentLine.points, x, y],
    });
  };

  const stopDrawing = () => {
    if (currentLine && currentLine.points.length > 2) {
      setLines([...lines, currentLine]);
    }
    setCurrentLine(null);
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setLines([]);
    setCurrentLine(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300"
      />
      
      {!readOnly && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md flex gap-2">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 cursor-pointer"
          />
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <button
            onClick={clearCanvas}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear
          </button>
          {onSave && (
            <button
              onClick={() => onSave(lines)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleDrawingCanvas;
