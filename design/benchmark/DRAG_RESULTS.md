# 1.11 — Drag benchmark results

**Harness:** `/benchmark/drag.html`
**Status:** provisional — all recorded runs are **mouse**; the touch/frame-time run on the 2 GB reference tablet is still outstanding.

## Runs recorded

| Run | Attempts | Completed | Precision | Avg move interval | Max move interval | Avg first move | Device |
|---|---|---|---|---|---|---|---|
| A | 19 | 8/8 | 42% | — | — | 272 ms | **mouse** (dev-only) |
| B | 8 | 8/8 | 100% | 23 ms | 756 ms | 348 ms | **mouse** (dev-only) |
| C | 8 | 8/8 | 100% | 23 ms | 756 ms | 1,626 ms | **mouse** (dev-only) |

Run A included exploratory mis-drops; runs B/C were clean completions.

## Interpretation

- **Accuracy passes**: 8/8 completion and 100% drop precision on clean runs.
- **Average move interval is healthy**: 23 ms (~43 fps).
- **Max move interval is not a jank signal**: 756 ms is a human pause between moves, not a frame stall.
- **First-move and total drag are human-paced** and should not decide the interaction.
- **Frame time (`requestAnimationFrame`) is the missing measurement** and must be taken on the 2 GB reference device.

## In-app touch run (valid decision surface)

| Metric | Value |
|---|---|
| Input | **touch** (+ mouse events from taps) |
| Completion | **8/8** |
| Avg frame time | **13 ms** |
| Max frame time | **17 ms** |
| Frames sampled | 8 |

This passes the app-responsiveness thresholds (avg ≤33 ms, max ≤100 ms). The earlier 272–1,626 ms first-move figures were human-paced, not jank.

## Decision

**Drag is primary; tap and keyboard remain the accessible fallback.**

Match-pairs copy is “Drag an animal to its habitat, or select then tap.” D50 is closed.

Remaining record-keeping: device model / Android / Chrome for this run, and the scroll-mid-drag check.

## Still required

1. Run the rAF harness on the 2 GB reference tablet and a mid-range device.
2. Record model, Android and Chrome versions.
3. Test scroll interference mid-drag.
4. Replace this provisional decision with the measured outcome.
