import { frechetDistance } from "@/features/learn/engine/metrics/frechet";

describe("frechetDistance", () => {
  test("identical polylines have zero distance", () => {
    const a = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const b = [...a];
    expect(frechetDistance(a, b)).toBeCloseTo(0, 6);
  });

  test("translated polylines reflect translation magnitude", () => {
    const a = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const b = [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
    ];
    // Parallel segments 5 units up and 5 right: minimal leash ~ sqrt(5^2 + 0^2) to sqrt(5^2 + 5^2)
    const d = frechetDistance(a, b);
    expect(d).toBeGreaterThan(4.9);
    expect(d).toBeLessThan(8);
  });

  test("empty inputs return Infinity", () => {
    expect(frechetDistance([], [])).toBe(Infinity);
  });
});
