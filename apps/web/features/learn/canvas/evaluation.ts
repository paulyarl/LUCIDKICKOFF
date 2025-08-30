import { Point, Path } from './CanvasEngine';

export interface StrokeEvaluation {
  score: number;
  pass: boolean;
}

export interface AreaFillEvaluation {
  coverage: number;
  colorOk: boolean;
  pass: boolean;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface HSLTolerance {
  h: number;
  s: number;
  l: number;
}

// Discrete Fréchet distance implementation
function discreteFrechetDistance(p: Point[], q: Point[]): number {
  const n = p.length;
  const m = q.length;
  
  if (n === 0 || m === 0) return Infinity;
  
  // Memoization table
  const ca = Array(n).fill(null).map(() => Array(m).fill(-1));
  
  function c(i: number, j: number): number {
    if (ca[i][j] > -1) return ca[i][j];
    
    const dist = euclideanDistance(p[i], q[j]);
    
    if (i === 0 && j === 0) {
      ca[i][j] = dist;
    } else if (i > 0 && j === 0) {
      ca[i][j] = Math.max(c(i - 1, 0), dist);
    } else if (i === 0 && j > 0) {
      ca[i][j] = Math.max(c(0, j - 1), dist);
    } else if (i > 0 && j > 0) {
      ca[i][j] = Math.max(
        Math.min(c(i - 1, j), c(i - 1, j - 1), c(i, j - 1)),
        dist
      );
    } else {
      ca[i][j] = Infinity;
    }
    
    return ca[i][j];
  }
  
  return c(n - 1, m - 1);
}

// Hausdorff distance as fallback
function hausdorffDistance(p: Point[], q: Point[]): number {
  if (p.length === 0 || q.length === 0) return Infinity;
  
  function directedHausdorff(a: Point[], b: Point[]): number {
    let maxDist = 0;
    for (const pointA of a) {
      let minDist = Infinity;
      for (const pointB of b) {
        const dist = euclideanDistance(pointA, pointB);
        minDist = Math.min(minDist, dist);
      }
      maxDist = Math.max(maxDist, minDist);
    }
    return maxDist;
  }
  
  return Math.max(
    directedHausdorff(p, q),
    directedHausdorff(q, p)
  );
}

function euclideanDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Normalize distance score to 0-1 range
function normalizeDistance(distance: number, pathLength: number): number {
  // Use path length as reference for normalization
  const normalizedDistance = distance / Math.max(pathLength, 1);
  return Math.max(0, 1 - normalizedDistance);
}

function calculatePathLength(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += euclideanDistance(points[i - 1], points[i]);
  }
  return length;
}

/**
 * Evaluate stroke path using discrete Fréchet distance with Hausdorff fallback
 */
export function evaluateStrokePath(
  user: Point[], 
  guide: Path, 
  threshold: number = 0.65
): StrokeEvaluation {
  if (user.length === 0 || guide.points.length === 0) {
    return { score: 0, pass: false };
  }
  
  let distance: number;
  const guideLength = calculatePathLength(guide.points);
  
  try {
    // Try discrete Fréchet distance first
    distance = discreteFrechetDistance(user, guide.points);
    
    // If Fréchet fails or returns invalid result, fallback to Hausdorff
    if (!isFinite(distance) || distance < 0) {
      distance = hausdorffDistance(user, guide.points);
    }
  } catch (error) {
    // Fallback to Hausdorff on any error
    distance = hausdorffDistance(user, guide.points);
  }
  
  const score = normalizeDistance(distance, guideLength);
  const pass = score >= threshold;
  
  return { score, pass };
}

/**
 * Convert RGB to HSL color space
 */
function rgbToHsl(r: number, g: number, b: number): HSLColor {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
}

/**
 * Check if two HSL colors are within tolerance
 */
function isColorWithinTolerance(
  color: HSLColor, 
  target: HSLColor, 
  tolerance: HSLTolerance
): boolean {
  // Handle hue wraparound (0-360 degrees)
  let hueDiff = Math.abs(color.h - target.h);
  hueDiff = Math.min(hueDiff, 360 - hueDiff);
  
  return (
    hueDiff <= tolerance.h &&
    Math.abs(color.s - target.s) <= tolerance.s &&
    Math.abs(color.l - target.l) <= tolerance.l
  );
}

/**
 * Evaluate area fill with HSL color matching and coverage analysis
 */
export function evaluateAreaFill(
  canvas: HTMLCanvasElement,
  mask: ImageData,
  targetHsl: HSLColor,
  tolerance: HSLTolerance = { h: 10, s: 8, l: 8 },
  coverageThreshold: number = 0.85
): AreaFillEvaluation {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { coverage: 0, colorOk: false, pass: false };
  }
  
  // Get canvas image data
  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  if (canvasData.width !== mask.width || canvasData.height !== mask.height) {
    return { coverage: 0, colorOk: false, pass: false };
  }
  
  let totalMaskPixels = 0;
  let filledPixels = 0;
  let correctColorPixels = 0;
  
  // Analyze each pixel
  for (let i = 0; i < mask.data.length; i += 4) {
    const maskAlpha = mask.data[i + 3];
    
    // Skip transparent mask pixels
    if (maskAlpha === 0) continue;
    
    totalMaskPixels++;
    
    const canvasR = canvasData.data[i];
    const canvasG = canvasData.data[i + 1];
    const canvasB = canvasData.data[i + 2];
    const canvasAlpha = canvasData.data[i + 3];
    
    // Check if pixel is filled (non-transparent)
    if (canvasAlpha > 0) {
      filledPixels++;
      
      // Convert to HSL and check color match
      const pixelHsl = rgbToHsl(canvasR, canvasG, canvasB);
      if (isColorWithinTolerance(pixelHsl, targetHsl, tolerance)) {
        correctColorPixels++;
      }
    }
  }
  
  if (totalMaskPixels === 0) {
    return { coverage: 0, colorOk: false, pass: false };
  }
  
  const coverage = filledPixels / totalMaskPixels;
  const colorAccuracy = filledPixels > 0 ? correctColorPixels / filledPixels : 0;
  const colorOk = colorAccuracy >= 0.9; // 90% of filled pixels must be correct color
  const pass = coverage >= coverageThreshold && colorOk;
  
  return { coverage, colorOk, pass };
}

/**
 * Evaluate dot-to-dot sequence with order and distance validation
 */
export function evaluateDotToDot(
  taps: Point[],
  targets: Point[],
  tolerancePx: number = 12
): boolean {
  if (taps.length !== targets.length) {
    return false;
  }
  
  // Check each tap in sequence
  for (let i = 0; i < taps.length; i++) {
    const distance = euclideanDistance(taps[i], targets[i]);
    if (distance > tolerancePx) {
      return false;
    }
  }
  
  return true;
}

/**
 * Evaluate layer order by comparing string arrays
 */
export function evaluateLayerOrder(
  order: string[],
  target: string[]
): boolean {
  if (order.length !== target.length) {
    return false;
  }
  
  for (let i = 0; i < order.length; i++) {
    if (order[i] !== target[i]) {
      return false;
    }
  }
  
  return true;
}

// Export utility functions for advanced use cases
export {
  discreteFrechetDistance,
  hausdorffDistance,
  euclideanDistance,
  rgbToHsl,
  isColorWithinTolerance
};
