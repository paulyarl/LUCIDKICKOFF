#!/usr/bin/env node
// S3.5 / D33 — bundle a pack into a signed `.lcpack` file for field import.
//
// Reads apps/web/public/packs/<slug>/manifest.json (run export-pack-manifest
// first — signature required), downloads every asset, and writes
//   out/lcpack/<slug>-<version>.lcpack
// = JSON { format:'lcpack', manifest, files: { url: {b64, sha256} } }
//
// Usage: node scripts/export-lcpack.cjs <slug> [base-url]
//   base-url defaults to http://localhost:3000

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const slug = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:3000';
const manifestPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'packs', slug, 'manifest.json');
const OUT_DIR = path.join(__dirname, '..', 'out', 'lcpack');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

(async () => {
  if (!slug) { console.error('usage: export-lcpack.cjs <slug> [base-url]'); process.exit(1); }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.signature) {
    console.error('manifest.json is unsigned — set PACK_SIGNING_PRIVATE_JWK and re-export first');
    process.exit(1);
  }

  const files = {};
  for (const asset of manifest.assets ?? []) {
    const url = new URL(asset.url, BASE).href;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${asset.url} -> ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const hex = sha256(buf);
    if (asset.sha256 && hex !== asset.sha256) throw new Error(`hash mismatch: ${asset.url}`);
    files[asset.url] = { b64: buf.toString('base64'), sha256: hex };
    console.log(`${asset.url}  ${(buf.length / 1024).toFixed(0)} KB`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `${slug}-${manifest.version}.lcpack`);
  fs.writeFileSync(out, JSON.stringify({ format: 'lcpack', manifest, files }));
  console.log(`wrote ${out} (${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
})().catch((e) => { console.error(e); process.exit(1); });
