import { resampleStroke } from "@/features/learn/engine/resample";

describe("resampleStroke", () => {
  test("resamples to fixed count with endpoints preserved", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const out = resampleStroke(pts, 5);
    expect(out).toHaveLength(5);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[4]).toEqual({ x: 10, y: 0 });
    // Equally spaced at 0, 2.5, 5, 7.5, 10
    expect(out[1].x).toBeCloseTo(2.5, 5);
    expect(out[2].x).toBeCloseTo(5, 5);
    expect(out[3].x).toBeCloseTo(7.5, 5);
  });

  test("degenerate input returns repeated single point", () => {
    const pts = [
      { x: 3, y: 4 },
      { x: 3, y: 4 },
      { x: 3, y: 4 },
    ];
    const out = resampleStroke(pts, 4);
    expect(out).toHaveLength(4);
    for (const p of out) expect(p).toEqual({ x: 3, y: 4 });
  });
});
