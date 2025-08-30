import { evaluateStrokePath } from "@/features/learn/engine/evaluators/strokePath";

const line = (x0: number, y0: number, x1: number, y1: number, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { x: x0 + t * (x1 - x0), y: y0 + t * (y1 - y0) };
  });

describe("evaluateStrokePath", () => {
  const rubric = {
    maxFrechetPass: 18,
    starThresholds: [8, 14, 18] as [number, number, number],
    resamplePoints: 64,
  };

  test("perfect match yields 3 stars and pass", () => {
    const guide = line(0, 0, 100, 0, 20);
    const attempt = line(0, 0, 100, 0, 20);
    const r = evaluateStrokePath(guide, attempt, rubric);
    expect(r.passed).toBe(true);
    expect(r.stars).toBe(3);
    expect(r.metrics.frechet).toBeCloseTo(0, 6);
  });

  test("noisy but close attempt yields at least 1 star and pass", () => {
    const guide = line(0, 0, 100, 0, 20);
    const attempt = line(0, 2, 100, 2, 20); // shifted up by 2px
    const r = evaluateStrokePath(guide, attempt, rubric);
    expect(r.passed).toBe(true);
    expect(r.stars).toBeGreaterThanOrEqual(1);
    expect(r.metrics.frechet).toBeLessThanOrEqual(rubric.maxFrechetPass);
  });

  test("far attempt fails and gets 0 stars", () => {
    const guide = line(0, 0, 100, 0, 20);
    const attempt = line(0, 100, 100, 100, 20); // 100px up
    const r = evaluateStrokePath(guide, attempt, rubric);
    expect(r.passed).toBe(false);
    expect(r.stars).toBe(0);
    expect(r.metrics.frechet).toBeGreaterThan(rubric.maxFrechetPass);
  });
});
