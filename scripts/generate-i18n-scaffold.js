#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJson(p, obj) {
  const json = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(p, json, 'utf8');
}

function usage() {
  console.log('Usage: node scripts/generate-i18n-scaffold.js <locale>');
  console.log('Example: node scripts/generate-i18n-scaffold.js fr');
}

const locale = process.argv[2];
if (!locale) {
  usage();
  process.exit(1);
}

const root = process.cwd();
const msgsDir = path.join(root, 'lib', 'i18n', 'messages');
const enPath = path.join(msgsDir, 'en.json');
const targetPath = path.join(msgsDir, `${locale}.json`);

const en = readJson(enPath);
if (!en) {
  console.error('Could not read', enPath);
  process.exit(1);
}

const existing = readJson(targetPath) || {};

// Merge: ensure all keys from EN are present. Preserve existing target translations.
const merged = {};
for (const key of Object.keys(en)) {
  merged[key] = Object.prototype.hasOwnProperty.call(existing, key) ? existing[key] : en[key];
}

// Also keep any extra keys already in target that aren't in EN (rare but possible)
for (const key of Object.keys(existing)) {
  if (!Object.prototype.hasOwnProperty.call(merged, key)) {
    merged[key] = existing[key];
  }
}

// Ensure directory exists
fs.mkdirSync(msgsDir, { recursive: true });
writeJson(targetPath, merged);

console.log(`Scaffolded ${locale}.json with ${Object.keys(merged).length} keys.`);
