# Export & Provenance Checklist — 35 assets

**Input:** `design/art/manifest.json` (35/35 `rendered`).
**Output:** files under `apps/web/public/art/…`, manifest rows at `approved`, and a generated `apps/web/lib/art.ts`.

---

## 1. Pull the originals

Download each winning render from Midjourney into:

```
design/art/raw/<id>.png
```

Keep the raw at 2× target. Do not overwrite a raw once a variant is approved — rejected variants stay out of the repo.

## 2. Cleanup

- Remove artifacts: extra limbs, disconnected trunks, stray animals, garbled text.
- Crop per the composition notes (lesson.02 mushroom, edge-cropped animals).
- Avatars: keep the face centred; hair may crop at the circle edge.
- Cover: do **not** bake the title into the art — the scrim is CSS.
- Icons/badges: reject any lettering; trace to SVG only if the shapes are clean.

## 3. Finishing pass (scene group only)

Apply to `hero.savanna`, `pack.amazing-animals.cover`, `lesson.*`, `habitat.*`, `empty.*`:

1. Paper/canvas grain, 5–10% soft light.
2. Warm grade toward the hero's golden-hour bias.
3. Match black levels; no crushed shadows.
4. Re-export at the manifest widths.

Do **not** grain avatars, badges or icons — they are UI elements and should stay crisp.

## 4. Export

| Group | Format | Widths (from manifest) |
|---|---|---|
| scenes | WebP q80 | 1600/1280, 640, 320 |
| animals | WebP q80 | 640, 320, 160 |
| habitats | WebP q80 | 480, 240 |
| avatars | WebP q80 | 256, 128, 64 |
| badges | WebP q80 (+SVG if traced) | 512, 256, 128 |
| icons | WebP q80 (+SVG preferred) | 96, 48 |

Path convention:

```
apps/web/public/art/<group>/<id>-<width>.webp
```

Example: `apps/web/public/art/scenes/hero.savanna-1600.webp`.

No AVIF. No PNG in `public/art`. No `final-v2` filenames.

## 5. Provenance (per asset)

Fill in the manifest row:

- `job_id`, `seed`, `model` (from Midjourney)
- `prompt_hash` (sha256 of the prompt string)
- `reviewer`
- `licence` = `midjourney-paid` + tier note
- `status`: `rendered` → `cleaned` → `approved`
- `approved_at` (ISO date)

If the entity's USD gross revenue is over $1M, confirm the Pro/Mega requirement before marking `approved`.

## 6. Verify

```bash
npm run art:check        # warns on missing files/alt
ART_STRICT=1 npm run art:check   # fails (use in CI once exported)
npm run art:generate     # regenerates apps/web/lib/art.ts
```

`art:check` validates:

- unique ids
- alt text present unless `decorative: true`
- the largest width file exists for every asset
- every manifest asset has a recipe and an aspect ratio

## 7. Sign-off

- Per-screen fidelity sign-off (D44): home, pack detail, player, reward, profile picker.
- Art suitability review: cultural accuracy, no real likeness, no animal print/close contact, no lettering.
- Only then flip `status` to `approved` and wire the screens.

## 8. Tracking sheet

`design/art/export-tracking.csv` — one row per asset with empty provenance columns. Fill as you go; it mirrors the manifest.

---

## Definition of done

- [ ] 35 raw files in `design/art/raw/`
- [ ] 35 assets cleaned; scenes grained
- [ ] 35 × widths exported under `public/art/`
- [ ] every manifest row `approved` with provenance
- [ ] `ART_STRICT=1 npm run art:check` passes
- [ ] `apps/web/lib/art.ts` regenerated
- [ ] five screens fidelity-signed
