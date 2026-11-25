#!/usr/bin/env node
// S3.5 — generate the Ed25519 pack-signing keypair (ADR-001).
//
// Prints:
//   PACK_SIGNING_PRIVATE_JWK  → keep in the export environment / secrets
//   NEXT_PUBLIC_PACK_PUBLIC_KEY → SPKI base64 to embed in apps/web/.env.local
//
// Usage: node scripts/gen-pack-key.cjs
const crypto = require('crypto');

(async () => {
  const { publicKey, privateKey } = await crypto.webcrypto.subtle.generateKey(
    { name: 'Ed25519' }, true, ['sign', 'verify'],
  );
  const spki = await crypto.webcrypto.subtle.exportKey('spki', publicKey);
  const jwk = await crypto.webcrypto.subtle.exportKey('jwk', privateKey);
  jwk.kid = 'pack-key-1';

  console.log('NEXT_PUBLIC_PACK_PUBLIC_KEY=' + Buffer.from(spki).toString('base64'));
  console.log('');
  console.log('# keep secret — export environment only:');
  console.log('PACK_SIGNING_PRIVATE_JWK=' + Buffer.from(JSON.stringify(jwk)).toString('base64'));
})().catch((e) => { console.error(e); process.exit(1); });
