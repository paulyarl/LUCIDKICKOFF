#!/usr/bin/env node
/**
 * Validate design/art/manifest.json and the exported files.
 * Run: npm run art:check
 * Strict (fails on missing files): ART_STRICT=1 npm run art:check
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "design/art/manifest.json"), "utf8"),
);
const assets = manifest.assets ?? [];
const recipes = manifest.recipes ?? {};
const strict = process.env.ART_STRICT === "1";

const errors = [];
const warnings = [];
const seen = new Set();

for (const a of assets) {
  const where = a.id ?? "(missing id)";
  if (!a.id) errors.push("asset without id");
  if (seen.has(a.id)) errors.push(`${where}: duplicate id`);
  seen.add(a.id);

  if (!a.group) errors.push(`${where}: missing group`);
  if (!a.recipe || !recipes[a.recipe])
    errors.push(`${where}: recipe "${a.recipe}" not defined`);
  if (!a.aspect) errors.push(`${where}: missing aspect`);
  if (!Array.isArray(a.widths) || a.widths.length === 0)
    errors.push(`${where}: missing widths`);

  const alt = (a.alt ?? "").trim();
  if (!alt && !a.decorative)
    errors.push(`${where}: empty alt without decorative: true`);

  if (!Array.isArray(a.widths) || a.widths.length === 0) continue;
  const max = Math.max(...a.widths);
  const format = a.format ?? "webp";
  const rel = path.join(
    "apps/web/public/art",
    a.group,
    `${a.id}-${max}.${format}`,
  );
  if (!fs.existsSync(path.join(root, rel))) {
    const msg = `${where}: missing export ${rel}`;
    if (strict) errors.push(msg);
    else warnings.push(msg);
  }
}

const missing = warnings.length;
console.log(
  `art manifest: ${assets.length} assets · ${assets.length - missing}/${assets.length} exported · ` +
    `${errors.length} error(s) · ${warnings.length} warning(s)`,
);
for (const e of errors) console.error(`  ERROR  ${e}`);
if (warnings.length) {
  for (const w of warnings) console.warn(`  WARN   ${w}`);
  if (!strict)
    console.warn("  (set ART_STRICT=1 to treat missing exports as errors)");
}

process.exit(errors.length ? 1 : 0);
