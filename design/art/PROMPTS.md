# Production prompts — 35 assets

**Manifest:** `design/art/manifest.json` (35 rows: 12 rendered, 23 prompt-ready).
**How to use:** paste `subject` + the matching `suffix` for that recipe. Replace `<ANCHOR>` with the giraffe URL. Record job id + seed in the manifest.

**Portrait anchor:** `https://cdn.midjourney.com/7589f12f-abe4-4aa7-afbd-612022602849/0_0.png` (animal cards, sw 100)
**Landscape anchor:** the approved hero.savanna image (scenes, sw 150, stylize 200). Scene subjects append: "painterly texture, soft volumetric light, detailed fur, rounded friendly forms, cinematic wide composition".

---

## Recipe suffixes

**scene** (also used for habitats and empty states)
```
--style raw --stylize 200 --chaos 0 --sref <ANCHOR> --sw 150 --no text, letters, watermark, logo, signature, flat vector, vector, geometric poster, smooth gradient, extra limbs, extra animals, deformed animals
```

**animal**
```
--style raw --stylize 200 --chaos 0 --sref <ANCHOR> --sw 150 --no text, letters, watermark, logo, signature, flat vector, vector, geometric poster, smooth gradient, extra limbs, extra animals, deformed animals
```

**avatar**
```
--style raw --stylize 180 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, flat vector, thick outline, extra limbs, deformed face, realistic photograph
```

**badge**
```
--style raw --stylize 150 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, gradients, complex detail
```

**icon**
```
--style raw --stylize 120 --chaos 0 --no text, letters, watermark, logo, signature, photorealism, gradients, complex detail
```

---

## Remaining 23

| # | id | recipe | aspect | seed | subject |
|---|---|---|---|---|---|
| 1 | lesson.01.meet-wildlife | scene | 16:9 | 5001 | storybook children's illustration of a giraffe and a zebra grazing together on a Tanzanian savanna, acacia trees, Mount Kilimanjaro distant, warm ochre grass, teal sky, painterly texture, soft volumetric light, no text |
| 2 | lesson.02.habitats | scene | 16:9 | 5002 | storybook children's illustration of three Tanzanian habitats side by side — open grassland with acacia, a shallow lake with reeds, and a green forest edge — warm palette, painterly texture, soft light, no text |
| 3 | lesson.03.serengeti | scene | 16:9 | 5003 | storybook children's illustration of wildebeest and zebra crossing the Serengeti plains at golden hour, dust, acacia trees, warm ochre and teal palette, painterly texture, soft volumetric light, no text |
| 4 | lesson.04.protection | scene | 16:9 | 5004 | storybook children's illustration of a Tanzanian park ranger and two children planting acacia saplings near grazing wildlife, hopeful mood, warm palette, painterly texture, soft light, no text |
| 5 | lesson.05.wildlife-hero | scene | 16:9 | 5005 | storybook children's illustration of two children watching elephants and giraffes from a safe distance at sunset, warm palette, painterly texture, soft light, no text |
| 6 | empty.library | scene | 4:3 | 5006 | painterly children's book still life, visible textured brushwork of an open sketchbook with a pencil and a few acacia leaves on a cream surface, warm palette, painterly texture, soft light, no text |
| 7 | empty.offline | scene | 4:3 | 5007 | painterly children's book illustration, visible textured brushwork of a soft cloud with a dashed line and a small downloadable pack, teal and cream, gentle, no text |
| 8 | animal.elephant | animal | 1:1 | 5008 | storybook portrait of a friendly African elephant, head and shoulders, large ears, soft kind eyes, simple cream background with a hint of savanna grass, painterly texture, soft volumetric light, warm palette, centered, no text |
| 9 | habitat.grassland | scene | 1:1 | 5009 | painterly children's book illustration, visible textured brushwork of a Tanzanian grassland with acacia trees, warm ochre grass, teal sky, no animals, painterly texture, soft light, no text |
| 10 | habitat.lake | scene | 1:1 | 5010 | painterly children's book illustration, visible textured brushwork of a shallow Tanzanian lake with reeds and still water, teal and cream, no animals, painterly texture, soft light, no text |
| 11 | habitat.forest | scene | 1:1 | 5011 | painterly children's book illustration, visible textured brushwork of a green forest edge with tall trees and dappled light, no animals, painterly texture, soft light, no text |
| 12 | avatar.06 | avatar | 1:1 | 5012 | soft illustrated portrait of a Tanzanian girl, seven years old, short hair, smiling, shoulders-up, head and shoulders fully inside a teal circular background with clear margin, ochre t-shirt, storybook children's illustration, gentle painterly texture, soft shading, thin clean outlines, warm skin tones, rounded friendly forms, no text |
| 13 | badge.half-pack | badge | 1:1 | 5013 | flat vector badge icon, open book with an acacia leaf, teal and coral with a gold rim, bold rounded shapes, thick outline, centered emblem, no text, no letters |
| 14 | badge.all-lessons | badge | 1:1 | 5014 | flat vector badge icon, giraffe head with a heart, teal and coral with a gold rim, bold rounded shapes, thick outline, centered emblem, no text, no letters |
| 15 | badge.whole-pack | badge | 1:1 | 5015 | flat vector badge icon, shield with an acacia tree, teal and coral with a gold rim, bold rounded shapes, thick outline, centered emblem, no text, no letters |
| 16 | icon.nature | icon | 1:1 | 5016 | flat vector category icon, acacia tree and a giraffe silhouette, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 17 | icon.landforms | icon | 1:1 | 5017 | flat vector category icon, Mount Kilimanjaro silhouette with a sun, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 18 | icon.culture | icon | 1:1 | 5018 | flat vector category icon, drum and beaded pattern, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 19 | icon.school | icon | 1:1 | 5019 | flat vector category icon, open book and pencil, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 20 | icon.science | icon | 1:1 | 5020 | flat vector category icon, magnifying glass and leaf, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 21 | icon.health | icon | 1:1 | 5021 | flat vector category icon, heart and leaf, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 22 | icon.arts | icon | 1:1 | 5022 | flat vector category icon, paint palette and brush, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |
| 23 | icon.sports | icon | 1:1 | 5023 | flat vector category icon, ball and running figure, teal and coral on cream, bold rounded shapes, thick outline, single clear symbol, no text |

---

## Already rendered (12)

| id | note |
|---|---|
| hero.savanna | needs cleanup + export |
| pack.amazing-animals.cover | title via scrim; needs cleanup |
| animal.giraffe, animal.lion, animal.zebra, animal.flamingo | approved style |
| avatar.01–avatar.05 | circular mask, face-centred |
| badge.first-lesson | binoculars/acacia emblem |

## Export checklist per asset

- [ ] 2× render, cleaned (artifacts, text, anatomy)
- [ ] WebP at listed widths; SVG for icons/badges where possible
- [ ] Alt text from manifest (decorative icons: empty alt)
- [ ] Provenance row updated: job id, seed, model, prompt hash, reviewer, licence
- [ ] Status: `rendered` → `cleaned` → `approved`


---

## 36th asset — culture pack cover (added 24 Nov)

**id:** `pack.culture-traditions.cover` · **seed:** 5036 · **aspect:** 3:2 · **recipe:** scene (hero anchor)

```
storybook children's illustration of a Tanzanian cultural scene — a carved wooden drum, colourful kitenge textile patterns, and a traditional round house with a thatched roof — warm ochre, teal and coral palette, painterly texture, soft volumetric light, rounded friendly forms, cinematic composition with calm space for a title, no people, no text --ar 3:2 --style raw --stylize 200 --chaos 0 --sref <HERO_URL> --sw 150 --no text, letters, watermark, logo, signature, flat vector, vector, geometric poster, 3D render, CGI, smooth plastic, extra animals, deformed animals --seed 5036
```

After rendering: save to `design/art/raw/pack.culture-traditions.cover.png`, then `npm run art:export && npm run art:check`.


---

## ChatGPT rendering (added 24 Nov)

ChatGPT takes **prose, not parameters** — no `--ar`, `--sref`, `--stylize`.

1. Attach the approved hero or cover image and say **"match the style and brushwork of the attached reference."**
2. State the aspect explicitly: "wide 3:2 landscape", "16:9 cinematic", "square 1:1".
3. Put negatives in prose: **no text, lettering, logos or watermarks; no photorealism**.
4. Save the PNG to `design/art/raw/<id>.png`; `npm run art:export` now crops to the manifest aspect.

### Culture cover — ChatGPT prompt (seed 5036 equivalent)

```
Create a wide 3:2 landscape children's book illustration of a Tanzanian cultural scene: a carved wooden drum, colourful kitenge textile patterns draped over a low bench, and a traditional round house with a thatched roof. Warm ochre, teal and coral palette, painterly texture, soft volumetric light, rounded friendly forms, clean composition with calm empty space across the top for a title. No people. No text, lettering, logos or watermarks. Match the style and brushwork of the attached reference image.
```

After rendering: `design/art/raw/pack.culture-traditions.cover.png` → `npm run art:export && npm run art:check`.


---

## 37th asset — page wall-art (added 24 Nov)

**id:** `ui.wallart` · **tool:** ChatGPT · **aspect:** 16:9 · **decorative**

```
Create a subtle, low-contrast wall art pattern for a children's app background: Tanzanian geometric motifs, acacia leaves and kitenge-inspired shapes in muted cream, teal and ochre. Flat vector, very low contrast so UI text stays readable, no text, lettering or logos, wide 16:9, calm and repeatable. Match the palette of the attached reference image.
```

Save to `design/art/raw/ui.wallart.png`, then `npm run art:export && npm run art:check`.
