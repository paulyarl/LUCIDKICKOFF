import { resampleStroke, Point } from "../resample";
import { frechetDistance } from "../metrics/frechet";

export type StrokePathRubric = {
  // Maximum Fréchet distance (in px) to be considered pass.
  maxFrechetPass: number; // e.g., 18
  // Distance thresholds to award stars. Lower distance = better.
  // Example: [8, 14, 18] → <=8 => 3 stars, <=14 => 2 stars, <=18 => 1 star, else 0
  starThresholds: [number, number, number];
  resamplePoints?: number; // default 128
};

export type StrokePathResult = {
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  distance: number; // Fréchet distance (px)
  metrics: {
    frechet: number;
    resamplePoints: number;
  };
};

export function evaluateStrokePath(
  guide: Point[],
  attempt: Point[],
  rubric: StrokePathRubric
): StrokePathResult {
  const N = rubric.resamplePoints ?? 128;
  const g = resampleStroke(guide, N);
  const a = resampleStroke(attempt, N);
  const d = frechetDistance(g, a);

  const [t3, t2, t1] = rubric.starThresholds; // strictest to loosest
  let stars: 0 | 1 | 2 | 3 = 0;
  if (d <= t3) stars = 3;
  else if (d <= t2) stars = 2;
  else if (d <= t1) stars = 1;
  else stars = 0;

  const passed = d <= rubric.maxFrechetPass;
  return {
    passed,
    stars,
    distance: d,
    metrics: { frechet: d, resamplePoints: N },
  };
}
