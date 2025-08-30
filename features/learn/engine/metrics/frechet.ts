export type Point = { x: number; y: number };

/**
 * Discrete Fréchet distance between two polylines.
 * O(n*m) with memoization.
 */
export function frechetDistance(a: Point[], b: Point[]): number {
  if (!a.length || !b.length) return Infinity;
  const n = a.length;
  const m = b.length;
  const ca = Array.from({ length: n }, () => new Array<number>(m).fill(-1));

  const dist = (i: number, j: number) =>
    Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);

  function c(i: number, j: number): number {
    if (ca[i][j] > -1) return ca[i][j];
    let val: number;
    if (i === 0 && j === 0) {
      val = dist(0, 0);
    } else if (i > 0 && j === 0) {
      val = Math.max(c(i - 1, 0), dist(i, 0));
    } else if (i === 0 && j > 0) {
      val = Math.max(c(0, j - 1), dist(0, j));
    } else if (i > 0 && j > 0) {
      val = Math.max(
        Math.min(c(i - 1, j), c(i - 1, j - 1), c(i, j - 1)),
        dist(i, j)
      );
    } else {
      val = Infinity;
    }
    ca[i][j] = val;
    return val;
  }

  return c(n - 1, m - 1);
}
