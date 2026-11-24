# 1.11 — Drag benchmark protocol

**Harness:** `/benchmark/drag.html` (static, no app shell)
**Goal:** decide whether pointer drag survives on the 2 GB reference tablet, or whether match-pairs ships tap-first / handle-only.

## Devices

| Role | Record |
|---|---|
| 2 GB Android reference | model, Android version, Chrome version |
| Mid-range Android | model, Android version, Chrome version |

Run in Chrome, not a WebView. Disable battery saver. Use the same Wi-Fi for both.

## Steps

1. Open `https://<site>/benchmark/drag.html`.
2. **Drag pass** — drag each of the 8 animals to its habitat. Do not use tap.
3. **Tap pass** — Reset, then select an animal and tap its habitat.
4. Repeat each pass 3 times; Reset between passes.
5. **Scroll test** — with the page scrolled so a chip sits near the bottom edge, start a drag and try to scroll mid-gesture. Record whether the page scrolls, the drag sticks, or the gesture is lost.
6. Copy the metrics table after each pass.

## Metrics

| Metric | Threshold |
|---|---|
| Drop accuracy | **100%** |
| Avg first-move latency | **≤ 100 ms** |
| Avg drag duration | **≤ 250 ms** |
| Max drag duration | **≤ 500 ms** |
| Lost pointer / stuck ghost | **0** |
| Scroll during drag | acceptable only if intentional |

## Decision

| Result | Action |
|---|---|
| All thresholds pass | Keep pointer drag as the primary interaction; tap/keyboard remains the accessible equivalent |
| First-move or drag latency fails | **Handle-only drag** (drag from a grip, not the whole card) |
| Accuracy or lost-pointer fails | **Tap-first**; drag becomes an enhancement behind a flag |
| Scroll interference is severe | Re-test with `touch-action: pan-y` on chips or handle-only |

Record the outcome as an ADR note in the sprint plan; do not silently ship a failing interaction.

## Results template

```
Device:
Android / Chrome:
Pass: drag 1/2/3, tap 1/2/3
Accuracy:
Avg first move:
Avg drag / max:
Scroll during drag:
Verdict: PASS / HANDLE-ONLY / TAP-FIRST
Notes:
```
