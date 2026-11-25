#!/usr/bin/env node
/*
  Sprint 2.6 — Pack manifest v1 static export.

  For each catalog pack, writes apps/web/public/packs/<slug>/manifest.json:
    { schema, slug, version, generatedAt, pack, lessons, templates, assets, size_bytes }

  - version    : content-addressed stamp (sha256 of the pack payload, 12 hex chars)
  - assets[]   : every binary the pack needs offline (cover, template images,
                 step-guide media) with sha256 + bytes for prefetch verification
  - size_bytes : total download size shown in the UI before prefetch

  Required env (root .env.local): SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
  Usage: node scripts/export-pack-manifest.js [slug ...]
*/

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT_ROOT = path.join(__dirname, '..', 'apps', 'web', 'public', 'packs');
const MEDIA_KEYS = new Set(['image', 'overlay', 'mask', 'badge']);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (root .env.local)');
  process.exit(1);
}

const api = async (pathname) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`${pathname} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const storageUrl = (bucket, objectPath) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;

// Recursively collect absolute URLs stored in guide/rubric/hints media fields.
const collectMediaUrls = (node, into) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach((v) => collectMediaUrls(v, into));
  for (const [key, value] of Object.entries(node)) {
    if (
      MEDIA_KEYS.has(key) &&
      typeof value === 'string' &&
      (/^https?:\/\//.test(value) || value.startsWith('/'))
    ) {
      into.add(value);
    } else {
      collectMediaUrls(value, into);
    }
  }
};

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const fetchAsset = async (url, kind) => {
  // Same-origin paths are read from apps/web/public — they ship with the site.
  if (url.startsWith('/')) {
    const local = path.join(__dirname, '..', 'apps', 'web', 'public', url);
    if (!fs.existsSync(local)) throw new Error(`asset ${url} missing from public/`);
    const buf = fs.readFileSync(local);
    return { url, kind, sha256: sha256(buf), bytes: buf.byteLength };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asset ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { url, kind, sha256: sha256(buf), bytes: buf.byteLength };
};

const exportPack = async (pack) => {
  const { data: items } = { data: await api(`pack_items?pack_id=eq.${pack.id}&order=position`) };
  const lessonIds = items.filter((i) => i.kind === 'lesson').map((i) => i.ref_id);
  const templateIds = items.filter((i) => i.kind === 'template').map((i) => i.ref_id);

  const lessons = lessonIds.length
    ? await api(`lessons?id=in.(${lessonIds.map(encodeURIComponent).join(',')})`)
    : [];
  const steps = lessonIds.length
    ? await api(`lesson_steps?lesson_id=in.(${lessonIds.map(encodeURIComponent).join(',')})&order=order_index`)
    : [];

  // Coloring templates linked from lessons count as pack assets too (Study & Color chain).
  const coloringIds = lessons.map((l) => l.coloring_template_id).filter(Boolean);
  const allTemplateIds = [...new Set([...templateIds, ...coloringIds])];
  const templates = allTemplateIds.length
    ? await api(`templates?id=in.(${allTemplateIds.join(',')})`)
    : [];

  const assetUrls = new Map();
  if (pack.cover_path) assetUrls.set(storageUrl('packs', pack.cover_path), 'cover');
  for (const t of templates) {
    if (t.image_path) assetUrls.set(storageUrl('templates', t.image_path), 'template');
  }
  for (const s of steps) {
    const media = new Set();
    collectMediaUrls(s.guide, media);
    collectMediaUrls(s.hints, media);
    collectMediaUrls(s.rubric, media);
    media.forEach((u) => assetUrls.set(u, 'media'));
  }

  const assets = [];
  for (const [url, kind] of assetUrls) {
    assets.push(await fetchAsset(url, kind));
  }

  const orderedLessons = lessonIds
    .map((id) => lessons.find((l) => l.id === id))
    .filter(Boolean)
    .map((l) => ({
      id: l.id,
      title: l.title,
      est_minutes: l.est_minutes ?? null,
      status: l.status,
      coloring_template_id: l.coloring_template_id ?? null,
      steps: steps
        .filter((s) => s.lesson_id === l.id)
        .map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          order_index: s.order_index,
          guide: s.guide,
          rubric: s.rubric ?? null,
          hints: s.hints ?? null,
        })),
    }));

  const content = {
    pack: {
      id: pack.id,
      slug: pack.slug,
      title: pack.title,
      is_free: pack.is_free,
      age_band: pack.age_band ?? null,
      objectives: pack.objectives ?? [],
      title_i18n: pack.title_i18n ?? {},
      description_i18n: pack.description_i18n ?? {},
    },
    lessons: orderedLessons,
    templates: templates.map((t) => ({ id: t.id, title: t.title, image_path: t.image_path })),
  };
  const contentBytes = Buffer.byteLength(JSON.stringify(content));

  const manifest = {
    schema: 1,
    slug: pack.slug,
    version: sha256(JSON.stringify(content)).slice(0, 12),
    generatedAt: new Date().toISOString(),
    ...content,
    assets,
    size_bytes: assets.reduce((sum, a) => sum + a.bytes, 0) + contentBytes,
  };

  const dir = path.join(OUT_ROOT, pack.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(
    `${pack.slug}: ${orderedLessons.length} lessons, ${assets.length} assets, ` +
      `${(manifest.size_bytes / 1024).toFixed(0)} KB, v${manifest.version}`
  );
};

const main = async () => {
  const slugs = process.argv.slice(2);
  const packs = slugs.length
    ? await api(`packs?slug=in.(${slugs.join(',')})`)
    : await api('packs');
  if (!packs.length) {
    console.warn('no packs matched');
    return;
  }
  for (const pack of packs) {
    try {
      await exportPack(pack);
    } catch (err) {
      console.error(`${pack.slug}: export failed — ${err.message}`);
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
