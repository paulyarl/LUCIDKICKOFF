export type CanvasPoint = { x: number; y: number };

const DOT_INSET = 24;
const CANVAS_W = 800;
const CANVAS_H = 600;

export function clampDotPoint(point: CanvasPoint): CanvasPoint {
  return {
    x: Math.min(CANVAS_W - DOT_INSET, Math.max(DOT_INSET, point.x)),
    y: Math.min(CANVAS_H - DOT_INSET, Math.max(DOT_INSET, point.y)),
  };
}

export function stripLegacyOriginSentinels(points: CanvasPoint[]): CanvasPoint[] {
  let originCount = 0;
  while (originCount < points.length && points[originCount].x === 0 && points[originCount].y === 0) {
    originCount += 1;
  }
  return originCount > 0 ? points.slice(originCount) : points;
}
