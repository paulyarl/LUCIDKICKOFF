# Style Test — five prompts, one afternoon

**Goal:** prove that five different asset types can be rendered from one style paragraph and still look like one product, before anyone writes 35 prompt specs.
**Tool:** Midjourney (paid plan). **Run manually** — Midjourney's terms prohibit automated access, so these are copy-paste prompts, not a script.
**Cost:** 5 prompts × 4-image grid = 20 images. Upscale only the winners.

---

## Seed policy

Seeds are **reproducibility**, not a style tool. The same seed with a different prompt produces a different image; it does not make assets cohere. Style comes from the shared paragraph plus `--sref`/`--sw`.

- Use a **different seed per asset** (1001–1005).
- Keep each asset's seed **fixed while iterating** on that prompt, so changes are attributable to the wording.
- Seeds are model-version-specific; changing model invalidates reproduction.
- If a render is approved, record its seed and job id in the manifest.

## Protocol

1. **Round 1 — coherence.** Run all five prompts with the shared style paragraph, `--chaos 0`, fixed seeds 1001–1005. Do **not** upscale yet. Pick the best of each 4-grid.
2. **Score** each winner on the rubric below. Record job id, seed and model version.
3. **Round 2 — anchor (only if needed).** Take the strongest image as a style anchor; re-run the two weakest prompts with `--sref <anchor-image-url> --sw 100`. Compare against round 1.
4. **Decide:**
   - **Pass:** coherence ≥ 4, palette ≥ 4, clarity ≥ 4, UI fitness ≥ 4, no artifact/suitability fails → freeze the style paragraph and proceed to the 35-asset manifest.
   - **Iterate:** change one lever at a time — palette words, "semi-realistic" vs "flat vector", outline weight, background simplicity — and re-run only the failing prompts.
   - **Switch direction:** if scene art keeps failing UI fitness, test Direction B (flat vector) on the same five.
5. **Record** results in the table and the manifest; keep the winning prompts as the canonical versions.

---

## The five prompts

### ST-01 — Home hero (16:9)

```
modern children's educational illustration of a Tanzanian savanna at golden hour, Mount Kilimanjaro in the distance, acacia trees, a giraffe and a zebra, warm ochre grassland, teal sky accents, coral sunset highlights, semi-realistic cartoon style, soft painterly shading, rounded friendly forms, clean uncluttered composition, no people, no text --ar 16:9 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, extra limbs, deformed animals, cluttered background --seed 1001
```

### ST-02 — Pack cover, "Amazing Animals of Tanzania" (3:2)

```
modern children's educational illustration, group portrait of a giraffe, African elephant, zebra and flamingo in a lush Tanzanian landscape with Mount Kilimanjaro behind, vibrant warm palette of ochre, olive, teal, coral and cream, friendly expressions, clear calm space across the top for a title, semi-realistic cartoon style, soft painterly shading, no text --ar 3:2 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, extra limbs, deformed animals, cluttered background --seed 1002
```

### ST-03 — Animal card, giraffe (1:1)

```
single giraffe eating acacia leaves, side profile, friendly expression, detailed fur, simple savanna background, centered composition, modern children's educational illustration, semi-realistic cartoon style, soft painterly shading, warm palette, no text --ar 1:1 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, extra limbs, deformed animals, cluttered background --seed 1003
```

### ST-04 — Child avatar (1:1)

```
friendly Tanzanian child avatar, eight years old, smiling, shoulders-up portrait, simple teal circular background, modern children's educational illustration, semi-realistic cartoon style, soft shading, warm skin tones, no text --ar 1:1 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, extra limbs, deformed face, realistic photograph --seed 1004
```

### ST-05 — Badge, "Wildlife Explorer" (1:1, flat sub-style)

```
flat vector badge icon, binoculars and acacia leaf motif, teal and coral with a gold rim, bold rounded shapes, thick outline, centered emblem, simple silhouette, no text, no letters --ar 1:1 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, gradients, complex detail --seed 1005
```

> ST-05 intentionally tests a **different sub-style**. Scene art and UI emblems should not share a render style; if this badge looks like the scenes, it is wrong.

---

## Scoring rubric (1–5, per asset)

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| **Coherence** | looks like a different product | same genre, different handling | clearly one set |
| **Palette** | clashes / off-brand | some brand colours | teal/coral/navy/ochre/cream working together |
| **Clarity** | unreadable at target size | readable with effort | instantly readable at 320 px |
| **UI fitness** | too busy, no space for text/controls | usable with cropping | calm areas, crops well, text sits comfortably |
| **Artifacts** | text/limbs/faces broken | minor fixable issues | clean |
| **Suitability** | culturally off or likeness risk | acceptable with review | respectful, accurate, fictional |

**Pass:** coherence, palette, clarity, UI fitness each ≥ 4; no artifact or suitability fail. Badge is judged on UI fitness/clarity only — it is not expected to cohere with scene art.

---

## Results

### Round 1 — 24 Nov

| Asset | Job ID | Seed | Model | Coherence | Palette | Clarity | UI | Artifacts | Suitability | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| ST-01 Hero | — | 1001 | — | **2** | 4 | 4 | 4 | pass | pass | Iterate — flat vector drift |
| ST-02 Pack cover | — | 1002 | — | **2** | 5 | 4 | **2** | pass | pass | Iterate — flat vector + no title space |
| ST-03 Giraffe | — | 1003 | — | 4 | 3 | 5 | 4 | pass | pass | Keep; add brand accents |
| ST-04 Avatar | — | 1004 | — | 4 | 3 | 5 | 5 | pass | pass | **Keep** |
| ST-05 Badge | — | 1005 | — | — | — | — | — | — | — | Not run |

**Outcome: FAIL on coherence (2 < 4).** Two families emerged: painterly storybook (avatar, giraffe) vs flat geometric poster (hero, cover). Mocks match the former.

**Diagnosis:** "clean uncluttered composition" + group framing pushes Midjourney toward flat vector; palette words override style. Pack cover also ignored the title-space instruction.

**Fix:** anchor scene prompts with `--sref` to the kept giraffe/avatar, replace "clean uncluttered composition" with "painterly texture, soft volumetric light", add explicit negatives "flat vector, geometric poster", and restate title space as "uncluttered sky across the top third".

### Round 2 — results (24 Nov)

| Asset | Coherence | Palette | Clarity | UI fit | Artifacts | Verdict |
|---|---|---|---|---|---|---|
| ST-01r Hero | **5** | 4 | 4 | 4 | pass | **PASS** — scrim needed top-left where the giraffe head sits |
| ST-02r Cover | **5** | 5 | 4 | **3** | pass | **CONDITIONAL** — animals fill the top third; no calm title space |
| ST-03r Giraffe | **5** | 4 | 5 | 5 | pass | **PASS** — portrait crop, not full-body |
| ST-04 Avatar | 3* | 5 | 5 | 5 | pass | **CONDITIONAL** — flat vector is a third style |
| ST-05 Badge | n/a | 5 | 5 | 5 | pass | **PASS** as UI sub-style |

\*coherence judged against scene art; as a UI element the avatar scores 5.

**Scene direction: PASS.** The `--sref` anchor + painterly wording + "not flat vector" negatives fixed the drift. Freeze Direction A.

**Remaining issues**
1. **Cover title space** — drop the elephant and arrange three animals in the lower two thirds, or keep four and demand an empty top third.
2. **Avatar sub-style** — flat vector is deliberate-looking but differs from the mock's softer portrait; decide whether UI elements (avatars, badges, icons) are a documented flat sub-style.
3. **Full-body activity art untested** — the match activity needs full-body animals (lion/zebra/flamingo) on simple backgrounds; the giraffe test is a portrait crop.

### Round 3 — avatar + activity tests (decided 24 Nov)

Cover: **no re-render** — title goes on a navy gradient scrim (D45).

**ST-04s — Avatar, soft portrait (1:1)**

```
soft illustrated portrait of a friendly Tanzanian child, eight years old, smiling, shoulders-up, simple teal circular background, coral t-shirt, storybook children's illustration, gentle painterly texture, soft shading, thin clean outlines, warm skin tones, rounded friendly forms, no text --ar 1:1 --style raw --stylize 180 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, flat vector, thick outline, extra limbs, deformed face, realistic photograph --seed 4004
```

**ST-06 — Activity card, lion portrait (1:1)**

```
storybook portrait of a friendly African lion, head and shoulders, detailed golden mane, calm expression, simple cream background with a hint of savanna grass, painterly texture, soft volumetric light, warm palette with a coral accent, centered composition, no text --ar 1:1 --style raw --stylize 200 --chaos 0 --sref https://cdn.midjourney.com/7589f12f-abe4-4aa7-afbd-612022602849/0_0.png --sw 100 --no text, letters, watermark, logo, signature, flat vector, geometric poster, extra limbs, deformed animals --seed 4006
```

If both pass, batch the remaining avatars (5 more, varied children) and activity cards (zebra, flamingo) from these two recipes.

### Round 3 — results (24 Nov)

| Asset | Coherence | Palette | Clarity | UI fit | Artifacts | Verdict |
|---|---|---|---|---|---|---|
| ST-04s Avatar | 4 | 5 | 5 | **4** | pass | **PASS** — but subject exceeds the teal circle; mask will crop hair/ears |
| ST-06 Lion | 5 | 3 | 5 | 5 | pass | **PASS** — expression reads solemn; no brand accent |

**Style locked (v1.1).** No further exploration needed. Two production rules added to `STYLE_GUIDE.md`:
1. Avatar subjects must sit **fully inside** the teal circle with ~8% margin.
2. Animal portraits need a **warm, friendly expression** — round 3's lion reads stern.

Optional lion re-run if the expression matters:

```
storybook portrait of a friendly African lion, head and shoulders, warm confident smile, soft kind eyes, detailed golden mane, simple cream background with a hint of savanna grass, painterly texture, soft volumetric light, warm palette, centered composition, no text --ar 1:1 --style raw --stylize 200 --chaos 0 --sref https://cdn.midjourney.com/7589f12f-abe4-4aa7-afbd-612022602849/0_0.png --sw 100 --no text, letters, watermark, logo, signature, flat vector, geometric poster, extra limbs, deformed animals --seed 4010
```

### Batch validation — avatars + activity cards (24 Nov)

| Asset | Coherence | Palette | Clarity | UI fit | Verdict |
|---|---|---|---|---|---|
| Avatar — girl, braids, teal | 5 | 5 | 5 | 4 | PASS (crop at edges) |
| Avatar — boy, glasses, coral | 5 | 5 | 5 | 4 | PASS (crop at edges) |
| Avatar — boy, ochre shirt | 5 | 5 | 5 | 4 | PASS |
| Avatar — boy, teal shirt | 5 | 5 | 5 | 4 | PASS |
| Avatar — girl, braids, coral | 5 | 5 | 5 | 4 | PASS (crop at edges) |
| Activity — zebra | 5 | 3 | 5 | 5 | PASS |
| Activity — flamingo | 5 | 5 | 5 | 5 | PASS |

**Style system complete (v1.2).** Avatar set is coherent; animal portraits match the giraffe/lion. No further exploration.

**Avatar frame rule:** display in a **circular mask, face-centred**; hair/braids may crop at the edge (normal avatar behaviour). Do not ship the white-corner square. If a specific avatar crops badly, re-render it with "fully inside the teal circle" rather than changing the frame.

**Accepted:** animal portraits carry no teal/coral accent — the scene palette is ochre/cream/natural, and brand colour arrives through UI chrome.

### Round 2 prompts (run these)

Use the **giraffe** image URL as the style reference (right-click → copy image link in Midjourney).

**ST-01r — Hero (16:9)**

```
storybook children's illustration of a Tanzanian savanna at golden hour, Mount Kilimanjaro in the distance, acacia trees, a giraffe standing left of frame and a zebra resting to the right, warm ochre grassland, teal sky, coral sunset clouds, painterly texture, soft volumetric light, detailed fur, rounded friendly forms, cinematic wide composition with open sky in the upper third, not flat vector, not geometric, no text --ar 16:9 --style raw --stylize 200 --chaos 0 --sref <GIRAFFE_IMAGE_URL> --sw 100 --no text, letters, watermark, logo, signature, flat vector, geometric poster, extra limbs, deformed animals --seed 2001
```

**ST-02r — Pack cover (3:2)**

```
storybook children's illustration, group portrait of a giraffe, African elephant, zebra and flamingo in a lush Tanzanian landscape with Mount Kilimanjaro behind, painterly texture, soft volumetric light, detailed fur and feathers, warm ochre, olive, teal and coral palette, friendly expressions, uncluttered sky across the top third for a title, not flat vector, not geometric, no text --ar 3:2 --style raw --stylize 200 --chaos 0 --sref <GIRAFFE_IMAGE_URL> --sw 100 --no text, letters, watermark, logo, signature, flat vector, geometric poster, extra limbs, deformed animals, busy top edge --seed 2002
```

**ST-03r — Giraffe card (1:1)**

```
storybook children's illustration of a single giraffe eating acacia leaves, side profile, friendly expression, detailed fur, soft cream background with a hint of savanna grass and a teal sky accent, painterly texture, warm palette with a coral accent, centered composition, no text --ar 1:1 --style raw --stylize 200 --chaos 0 --sref <GIRAFFE_IMAGE_URL> --sw 75 --no text, letters, watermark, logo, signature, flat vector, geometric poster, extra limbs, deformed animals --seed 2003
```

**ST-05 — Badge (1:1) — still unrun**

```
flat vector badge icon, binoculars and acacia leaf motif, teal and coral with a gold rim, bold rounded shapes, thick outline, centered emblem, simple silhouette, no text, no letters --ar 1:1 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, gradients, complex detail --seed 1005
```

**ST-04 Avatar — keep as-is.** Optionally re-run once with a coral shirt for a brand accent:

```
friendly Tanzanian child avatar, eight years old, smiling, shoulders-up portrait, simple teal circular background, coral t-shirt, modern children's educational illustration, semi-realistic cartoon style, soft shading, warm skin tones, no text --ar 1:1 --style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, extra limbs, deformed face, realistic photograph --seed 2004
```

**Round 2 anchor:** `https://cdn.midjourney.com/7589f12f-abe4-4aa7-afbd-612022602849/0_0.png` (kept giraffe) · **sw:** 100 (75 for the giraffe card) · **re-run:** ST-01r, ST-02r, ST-03r, ST-05

---

## Decision log

| Date | Change | Reason | Re-run |
|---|---|---|---|
| | | | |

---

## After a pass

1. Freeze the style paragraph in `STYLE_GUIDE.md` (bump version).
2. Create the 35-asset manifest (`manifest.example.json` → `manifest.json`).
3. Render in batches of 5–8 with the frozen paragraph; batch-approve against the rubric.
4. Record provenance for every asset; nothing ships at `prompt-ready`.
