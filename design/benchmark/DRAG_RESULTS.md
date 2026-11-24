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

## Provisional decision

**Tap-first, drag as enhancement.** Match-pairs instructs select-then-tap; pointer drag remains available but is not the primary path. Revisit only if the 2 GB frame-time run passes avg ≤33 ms / max ≤100 ms.

This is reversible and does not remove the drag implementation.

## Still required

1. Run the rAF harness on the 2 GB reference tablet and a mid-range device.
2. Record model, Android and Chrome versions.
3. Test scroll interference mid-drag.
4. Replace this provisional decision with the measured outcome.
