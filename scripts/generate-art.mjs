#!/usr/bin/env node
/**
 * Generate apps/web/lib/art.ts from design/art/manifest.json.
 * Run: npm run art:generate
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "design/art/manifest.json");
const outPath = path.join(root, "apps/web/lib/art.ts");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const assets = manifest.assets ?? [];

const esc = (s) => JSON.stringify(s ?? "");
const fileFor = (a, w) =>
  `/art/${a.group}/${a.id}-${w}.${a.format ?? "webp"}`;

const entries = assets
  .map((a) => {
    const widths = a.widths ?? [];
    const max = Math.max(...widths);
    const decorative = a.decorative ? "\n    decorative: true," : "";
    return `  ${esc(a.id)}: {
    src: ${esc(fileFor(a, max))},
    widths: [${widths.join(", ")}],
    alt: ${esc(a.alt ?? "")},${decorative}
  },`;
  })
  .join("\n");

const out = `// GENERATED FILE — do not edit. Run \`npm run art:generate\`.
// Source: design/art/manifest.json

export type ArtEntry = {
  src: string;
  widths: readonly number[];
  alt: string;
  decorative?: boolean;
};

export const art = {
${entries}
} as const satisfies Record<string, ArtEntry>;

export type ArtId = keyof typeof art;

/** Build a responsive srcset for raster art. Returns undefined for non-webp assets. */
export function artSrcSet(id: ArtId): string | undefined {
  const { src, widths } = art[id];
  if (!src.endsWith(".webp")) return undefined;
  return widths
    .map((w) => \`\${src.replace(/-\\d+\\.webp$/, \`-\${w}.webp\`)} \${w}w\`)
    .join(", ");
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, "utf8");
console.log(`art.ts generated: ${assets.length} entries -> ${path.relative(root, outPath)}`);
