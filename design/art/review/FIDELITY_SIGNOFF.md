# Sprint 0A — Frame Fidelity Sign-off

**Date:** 24 Nov 2026
**Viewport:** 1024 × 708 responsive (1024 CSS width), Chrome, DPR 2
**Routes:** `/frame/home`, `/frame/pack`, `/frame/picker`, `/frame/states`
**Art state:** gradient placeholders — export pass pending; ids and layout are final.

---

## Matrix

| Screen | Route | Layout | Type | Colour | Components | States | Result |
|---|---|---|---|---|---|---|---|
| Home | `/frame/home` | ✓ | ✓ | ✓ | ✓ | ✓ | **Approved** |
| Pack detail | `/frame/pack` | ✓ | ✓ | ✓ | ✓ | ✓ | **Approved** |
| Choose a learner | `/frame/picker` | ✓ | ✓ | ✓ | ✓ | ✓ | **Approved** |
| Empty & offline | `/frame/states` | ✓ | ✓ | ✓ | ✓ | ✓ | **Approved** |

**Reviewers:** Pauly (product/design)
**Commit:** pre-implementation frame (Sprint 0A)

---

## Checklist results

- [x] Layout grid and column widths match the mock at 1024
- [x] 4/8 px spacing rhythm
- [x] Card, chip, button and progress geometry
- [x] Baloo 2 display + Nunito body; scale and weights
- [x] Brand palette exact (`#00C4CC`, `#FF6F61`, `#002B36`, cream)
- [x] Icon size/weight and category grid
- [x] Empty/offline states present
- [x] 44 px touch targets
- [x] Global app header suppressed on `/frame/*` and `/design/*`
- [x] Responsive fallback below 1024 (pack stacks, cards 2-up, categories 4-up)

## Known deviations (accepted)

1. **Art is gradient placeholder** until the export pass. Approved as expected; ids are stable.
2. **Cover height** 224 px approved; real art may read heavier, revisit only if it crowds the title.
3. **Category labels** wrap to two lines below 1024; at 1024 the 8-column row is approved.
4. **Pack detail** stacks below `lg`; the 1024 two-column layout is the design target.
5. **No logo lockup** in the frame — the `LC` tile is a placeholder; the real logo is a vector brand task, not Midjourney.

## Gate

Sprint 0B (identity + content schema) may start. Visual changes after this point require a new sign-off entry, not a silent edit.
