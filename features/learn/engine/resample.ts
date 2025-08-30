export type Point = { x: number; y: number };

/**
 * Resample a polyline to a fixed number of points using path-length
 * proportional sampling with cumulative distance. Ensures the first and
 * last points are preserved. Degenerate inputs are handled.
 */
export function resampleStroke(points: Point[], target = 128): Point[] {
  const n = Math.max(2, Math.floor(target));
  if (!Array.isArray(points) || points.length === 0) return [];
  if (points.length === 1) return Array(n).fill(points[0]);

  // Compute cumulative distances
  const dists: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const d = Math.hypot(dx, dy);
    total += d;
    dists.push(total);
  }
  if (total === 0) return Array(n).fill(points[0]);

  const step = total / (n - 1);
  const result: Point[] = [points[0]];

  let j = 1;
  for (let i = 1; i < n - 1; i++) {
    const targetDist = i * step;
    while (j < dists.length && dists[j] < targetDist) j++;
    if (j >= dists.length) {
      result.push(points[points.length - 1]);
      continue;
    }
    const d0 = dists[j - 1];
    const d1 = dists[j];
    const t = d1 === d0 ? 0 : (targetDist - d0) / (d1 - d0);
    const p0 = points[j - 1];
    const p1 = points[j];
    result.push({ x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) });
  }

  result.push(points[points.length - 1]);
  return result;
}
