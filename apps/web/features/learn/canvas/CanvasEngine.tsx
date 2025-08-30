import React, { useRef, useEffect, useCallback, useState } from 'react';
import { StepSpec } from '../../../types/lesson';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface Path {
  points: Point[];
  id?: string;
  color?: string;
  width?: number;
}

export interface CanvasEngineProps {
  width: number;
  height: number;
  onStrokeComplete?: (stroke: Point[]) => void;
  onTap?: (point: Point) => void;
  constraints?: CanvasConstraints;
  className?: string;
}

export interface CanvasConstraints {
  tool?: 'pencil' | 'pen' | 'fill' | 'move';
  size_range?: [number, number];
  color?: string;
  locked?: boolean;
}

export class Constraints {
  private constraints: CanvasConstraints;

  constructor(stepSpec: StepSpec) {
    this.constraints = stepSpec.constraints || {};
  }

  isToolLocked(): boolean {
    return this.constraints.locked === true;
  }

  getAllowedTool(): 'pencil' | 'pen' | 'fill' | 'move' | null {
    return this.constraints.tool || null;
  }

  getSizeRange(): [number, number] | null {
    return this.constraints.size_range || null;
  }

  getLockedColor(): string | null {
    return this.constraints.color || null;
  }

  canUseTool(tool: string): boolean {
    if (!this.constraints.tool) return true;
    return this.constraints.tool === tool;
  }

  canUseSize(size: number): boolean {
    const range = this.getSizeRange();
    if (!range) return true;
    return size >= range[0] && size <= range[1];
  }

  canUseColor(color: string): boolean {
    const lockedColor = this.getLockedColor();
    if (!lockedColor) return true;
    return color === lockedColor;
  }
}

// Resample polyline to exactly 128 points using linear interpolation
function resamplePolyline(points: Point[], targetCount: number = 128): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(targetCount).fill(points[0]);

  // Calculate total path length
  let totalLength = 0;
  const segments: number[] = [];
  
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    segments.push(length);
    totalLength += length;
  }

  if (totalLength === 0) return Array(targetCount).fill(points[0]);

  const resampled: Point[] = [];
  const stepLength = totalLength / (targetCount - 1);
  
  resampled.push(points[0]); // First point
  
  let currentLength = 0;
  let segmentIndex = 0;
  let segmentProgress = 0;
  
  for (let i = 1; i < targetCount - 1; i++) {
    const targetLength = i * stepLength;
    
    // Find the segment containing this target length
    while (currentLength + segments[segmentIndex] - segmentProgress < targetLength && segmentIndex < segments.length - 1) {
      currentLength += segments[segmentIndex] - segmentProgress;
      segmentIndex++;
      segmentProgress = 0;
    }
    
    // Interpolate within the current segment
    const remainingDistance = targetLength - currentLength;
    const segmentRatio = (segmentProgress + remainingDistance) / segments[segmentIndex];
    
    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];
    
    const interpolated: Point = {
      x: p1.x + (p2.x - p1.x) * segmentRatio,
      y: p1.y + (p2.y - p1.y) * segmentRatio,
      pressure: p1.pressure !== undefined && p2.pressure !== undefined 
        ? p1.pressure + (p2.pressure - p1.pressure) * segmentRatio
        : p1.pressure || p2.pressure,
      timestamp: p1.timestamp !== undefined && p2.timestamp !== undefined
        ? p1.timestamp + (p2.timestamp - p1.timestamp) * segmentRatio
        : p1.timestamp || p2.timestamp
    };
    
    resampled.push(interpolated);
    segmentProgress += remainingDistance;
  }
  
  resampled.push(points[points.length - 1]); // Last point
  return resampled;
}

// Ghost trace animation
export function playGhost(
  canvas: HTMLCanvasElement, 
  path: Point[], 
  opts: { speed?: number; color?: string; width?: number } = {}
): Promise<void> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || path.length === 0) {
      resolve();
      return;
    }

    const { speed = 1, color = '#666', width = 2 } = opts;
    const totalDuration = path.length * (16 / speed); // ~60fps base speed
    const startTime = performance.now();
    
    const context = ctx as CanvasRenderingContext2D; // non-null local
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const pointIndex = Math.floor(progress * (path.length - 1));
      
      if (pointIndex > 0) {
        context.beginPath();
        context.moveTo(path[pointIndex - 1].x, path[pointIndex - 1].y);
        context.lineTo(path[pointIndex].x, path[pointIndex].y);
        context.stroke();
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
}

export const CanvasEngine = React.forwardRef<HTMLCanvasElement, CanvasEngineProps>(({ 
  width,
  height,
  onStrokeComplete,
  onTap,
  constraints,
  className = ''
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setRefs = useCallback((node: HTMLCanvasElement | null) => {
    // Ref's `current` property is read-only
    // so we need to assign it this way
    (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = node;
    }
  }, [ref]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const constraintsHelper = useRef<Constraints | null>(null);

  useEffect(() => {
    if (constraints) {
      // Create constraints helper when constraints change
      constraintsHelper.current = new Constraints({ 
        id: '', 
        title: '', 
        type: 'stroke-path', 
        constraints 
      });
    }
  }, [constraints]);

  const getPointerData = useCallback((event: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      pressure: event.pressure || 0.5,
      timestamp: performance.now()
    };
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getPointerData(event);
    
    // Check constraints
    if (constraintsHelper.current?.isToolLocked()) {
      const allowedTool = constraintsHelper.current.getAllowedTool();
      if (allowedTool === 'fill' || allowedTool === 'move') {
        // Handle tap for fill/move tools
        onTap?.(point);
        return;
      }
    }

    setIsDrawing(true);
    setCurrentStroke([point]);
    canvas.setPointerCapture(event.pointerId);
  }, [getPointerData, onTap]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDrawing) return;

    const point = getPointerData(event);
    setCurrentStroke(prev => [...prev, point]);
  }, [isDrawing, getPointerData]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
    }

    setIsDrawing(false);
    
    if (currentStroke.length > 1) {
      // Resample to 128 points and notify
      const resampled = resamplePolyline(currentStroke, 128);
      onStrokeComplete?.(resampled);
    }
    
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, onStrokeComplete]);

  // Draw current stroke preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentStroke.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw current stroke
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = constraints?.color || '#000';
    ctx.lineWidth = constraints?.size_range?.[0] || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }
    
    ctx.stroke();
  }, [currentStroke, constraints]);

  return (
    <canvas
      ref={setRefs}
      width={width}
      height={height}
      className={`touch-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ 
        touchAction: 'none',
        cursor: constraintsHelper.current?.getAllowedTool() === 'fill' ? 'crosshair' : 'default'
      }}
    />
  );
});

export default CanvasEngine;
