# LucidCraft Art — Style Guide (v0.1, style-test draft)

**Purpose:** one canonical style paragraph so 35 assets rendered in separate Midjourney sessions still look like one product.
**Status:** **v1.5 — scenes copy the hero recipe verbatim.** No new style descriptors per scene; the hero's exact style tail is the contract. Painterly scenes, flat UI emblems, soft-portrait avatars, portrait-crop activity art. Avatar set and activity cards validated. See `STYLE_TEST.md`.

---

## 1. Palette

| Role | Value | Use |
|---|---|---|
| Teal | `#00C4CC` | sky accents, UI highlights, badge base |
| Coral | `#FF6F61` | sunset, CTAs, badge accents |
| Navy | `#002B36` | deep shadows, outlines, text |
| Ochre | `#D9A441` (approx) | savanna grass, warmth |
| Olive | `#6B8E4E` (approx) | acacia foliage |
| Cream | `#FFF6E5` (approx) | skies, negative space, card backgrounds |

Midjourney does not take hex codes reliably — describe colours in words and anchor with a style reference (`--sref`) once an approved image exists.

---

## 2. Direction A — scene art (frozen v1.0)

The mockups use **semi-realistic children's illustration**, not flat vector. Round 2 proved this paragraph holds across hero, cover and animal card when anchored with `--sref`.

> painterly children's book illustration, visible textured brushwork, rich detail, soft volumetric light, detailed fur and feathers, rounded friendly forms, warm African savanna palette of ochre, olive, teal, coral and cream, gentle golden-hour light, no text

**Two anchors:**
- **Portrait anchor** (animal cards): `https://cdn.midjourney.com/7589f12f-abe4-4aa7-afbd-612022602849/0_0.png` · `--sw 100`
- **Landscape anchor** (scenes): the approved **hero.savanna** image · `--sw 200` · `--stylize 250`

Scenes must use the hero's exact tail: **"painterly texture, soft volumetric light, detailed fur, rounded friendly forms, cinematic wide composition"** — not "textured oil painting", not "storybook", not "digital illustration". Those variants produced flat-vector or smooth-3D results in rounds 3–4.

**Negatives (scenes):** `flat vector, vector, geometric poster, 3D render, CGI, smooth plastic, smooth gradient, cartoon eyes, googly eyes, comedic, extra limbs, extra animals, deformed animals`

**Do not use** the words "clean uncluttered composition" or "flat vector" in scene prompts — they pull toward geometric poster, as round 1 showed. Say "uncluttered sky across the top third" when title space is needed.

**Negative (always):**
> text, letters, watermark, logo, signature, photorealism, scary, extra limbs, deformed faces, cluttered background, harsh shadows

## 3. Direction B — flat vector (alternate, only if A fails)

> flat vector children's book illustration, bold rounded shapes, thick friendly outlines, limited palette of teal, coral, navy, ochre and cream, no gradients, clean geometric composition, no text

## 4. Sub-styles

### 4.1 UI emblems — flat vector (approved)

Badges, category icons and other UI emblems are **flat vector**, not scene art. Do not render them with the scene paragraph or the scene anchor.

> flat vector badge icon, bold rounded shapes, thick outline, teal and coral with a gold rim, centered emblem, simple silhouette, no text, no letters

### 4.2 Avatars — soft portrait (approved, D45)

**Display rule:** circular mask, face-centred; hair/braids may crop at the edge. Do not ship the white-corner square. If one avatar crops badly, re-render that asset — do not change the frame.

Avatars sit between the flat UI family and the painterly scenes: illustrated portrait, gentle painterly texture, soft shading, **thin** outlines, teal circular background. Not flat vector, not full scene art.

> soft illustrated portrait of a friendly Tanzanian child, eight years old, smiling, shoulders-up, **head and shoulders fully inside the teal circle with clear margin**, coral t-shirt, storybook children's illustration, gentle painterly texture, soft shading, thin clean outlines, warm skin tones, rounded friendly forms, no text

### 4.3 Activity art — portrait crops (approved, D45)

The match activity uses **portrait crops** (head/shoulders) in the scene style, not full-body animals. Reuse the giraffe treatment: detailed subject, simple cream background with a hint of habitat, centered. Because the cards are portraits, habitat matching relies on labels and instructions rather than body shape.

> storybook portrait of a friendly African lion, head and shoulders, detailed golden mane, **warm confident smile, soft kind eyes**, simple cream background with a hint of savanna grass, painterly texture, soft volumetric light, warm palette with a coral accent, centered composition, no text

---

### 4.4 Pack cover title — scrim (approved, D45)

Keep the four-animal cover art. The title sits on a **navy gradient scrim** across the top ~38% (80% opacity → transparent), cream text, contrast ≥ 4.5:1. This is a UI overlay, not an art change.

## 4.5 Finishing pass (all scene art)

Renders vary in surface texture — some come back painterly, some smoother. Unify them in **cleanup**, not by re-rendering:

1. Apply a shared subtle paper/canvas grain (5–10% opacity, soft light).
2. Slight warm grade to match the hero's golden-hour bias.
3. Match black levels; avoid crushed shadows.
4. Export the same widths and WebP quality.

Apply the same pass to the hero and cover so the whole set shares one finish. If a scene still reads as plastic after grain, it is a render problem — but grain fixes most of the drift.

## 4.6 ChatGPT recipe (tool-agnostic alternative)

When Midjourney hours are exhausted, ChatGPT image generation can produce the same set:

- **Reference first:** attach an approved asset and ask it to match style/brushwork.
- **Prose only:** no parameters; specify aspect in words and put negatives in prose.
- **Record the tool:** manifest `tool: "chatgpt"`, plus model/date/reviewer in provenance.
- **Export crops to the manifest aspect**, so a square ChatGPT render still becomes 3:2/16:9 correctly.

## 5. Composition rules

- **No text in images.** Midjourney garbles lettering; titles, labels and badge names are HTML overlays.
- **Leave UI space.** Heroes need calm areas for headers/buttons; pack covers need clear space at the top for the title.
- **Centred subjects** for cards and avatars; avoid critical detail at the edges (cropping).
- **One focal subject** per lesson illustration; backgrounds stay simple.
- **Friendly, not photoreal.** Children's tone; no scary expressions, no realistic gore, no brand logos.
- **Diversity without real likeness.** Fictional children, varied skin tones and hair; never a real person's likeness.
- **Cultural accuracy.** Real Tanzanian animals, Kilimanjaro, acacia, baobab; avoid generic "safari" clichés and colonial imagery.
- **Respectful distance.** Children never touch or sit against wildlife; show observation from behind, at a distance, or through a vehicle/fence.
- **Only the named animals.** No incidental foxes, hyenas or extra species unless the prompt asks for them.

---

## 6. Midjourney parameters (record what you actually use)

| Parameter | Value | Why |
|---|---|---|
| `--ar` | 16:9 hero, 3:2 cover, 1:1 animal/avatar/badge | Matches layout slots |
| `--style raw` | on | Less Midjourney "house style", closer to brief |
| `--stylize` | 150 | Detail without drifting |
| `--chaos` | 0 | Reproducibility during the test |
| `--seed` | fixed per prompt (1001–1005) | Comparable variants |
| `--sref` | round 2 only | Locks style to the approved anchor |
| `--sw` | 100 | Style-reference weight in round 2 |

Model version: record whatever is current at render (e.g. v7). Terms, models and parameters change — re-verify at render.

---

## 7. Provenance (required per asset)

`id · screen · tool · plan · model · job_id · seed · prompt_hash · reviewer · licence · status`

Status: `prompt-ready → rendered → cleaned → approved`. Nothing ships at `prompt-ready`.
