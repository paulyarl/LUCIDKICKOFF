#!/usr/bin/env node
/**
 * Export raw renders into apps/web/public/art at the manifest widths.
 *
 *   1. put winners in design/art/raw/<id>.png (or .jpg/.jpeg/.webp)
 *   2. npm run art:export
 *   3. npm run art:check
 *
 * No upscaling: a width larger than the source is skipped with a warning.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "design/art/manifest.json"), "utf8"),
);
const rawDir = path.join(root, "design/art/raw");
const outRoot = path.join(root, "apps/web/public/art");
const exts = [".png", ".jpg", ".jpeg", ".webp"];

const findRaw = (id) => {
  for (const ext of exts) {
    const p = path.join(rawDir, `${id}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
};

let written = 0;
let missing = 0;
let skipped = 0;

for (const asset of manifest.assets ?? []) {
  const raw = findRaw(asset.id);
  if (!raw) {
    console.warn(`  MISSING RAW  design/art/raw/${asset.id}.png`);
    missing++;
    continue;
  }

  const meta = await sharp(raw).metadata();
  const quality = asset.group === "icon" || asset.group === "badge" ? 85 : 80;
  const dir = path.join(outRoot, asset.group);
  fs.mkdirSync(dir, { recursive: true });

  for (const width of asset.widths ?? []) {
    if ((meta.width ?? 0) < width) {
      console.warn(
        `  SKIP ${asset.id} @${width}: source is ${meta.width}px wide`,
      );
      skipped++;
      continue;
    }
    const out = path.join(dir, `${asset.id}-${width}.webp`);
    const [aw, ah] = (asset.aspect ?? "1:1").split(":").map(Number);
    const height = Math.round((width * ah) / aw);
    await sharp(raw)
      .resize({ width, height, fit: "cover", position: "centre", withoutEnlargement: true })
      .webp({ quality })
      .toFile(out);
    written++;
  }
}

console.log(
  `art export: ${written} files written · ${missing} missing raw · ${skipped} skipped (upscale)`,
);
if (missing) {
  console.log("  add the missing winners to design/art/raw/ and re-run");
}
