# ADR-001 — Pack manifest signing (S3.5 / D33)

## Status
Accepted (Sprint 3.5)

## Context

Pack installs are driven by `public/packs/<slug>/manifest.json` — a static,
build-time export listing every offline asset with SHA-256 + byte size.
Two trust problems:

1. **Server path** — the manifest is same-origin static content. HTTPS +
   per-asset SHA-256 already covers transport tampering, but a compromised
   static host could ship a manifest *and* matching assets pointing at
   hostile content (hashes would be "self-consistent").
2. **Field path (D33)** — field devices get packs out-of-band (USB/SD via a
   `.lcpack` file). There is no origin to trust; the file itself must prove
   it came from LucidCraft content ops.

## Decision

Sign manifests with **Ed25519 over the canonical JSON** (sorted keys,
`signature`/`keyId` stripped) — `crypto.subtle`, zero dependencies.

- Private key: `PACK_SIGNING_PRIVATE_JWK` in the export environment only
  (never in the repo/bundle). Generate via `scripts/gen-pack-key.cjs`.
- Public key: `NEXT_PUBLIC_PACK_PUBLIC_KEY` (SPKI b64) embedded client-side.
- `scripts/export-pack-manifest.js` adds `signature` + `keyId` when the
  private key is configured.
- Verification policy (`lib/offline/manifestVerify.ts`):
  - signature present → must verify (bad signature = hard fail)
  - signature absent + first-party fetch → accepted (legacy manifests)
  - `.lcpack` manual import → **signature required** (D33)

## Alternatives considered

- **HMAC shared secret** — symmetric secret can't live in the client bundle;
  rejected.
- **X.509 / PKI** — operational overhead with no benefit at this scale;
  a single pinned Ed25519 keypair is sufficient for one signer (content ops).
- **Unsigned + SHA-256 only** — covers integrity, not authenticity; fine for
  the HTTPS path but fails D33's trust requirement on field devices.

## Consequences

- Key rotation = new `keyId` + re-export manifests; old devices reject
  new-key signatures until the app updates (acceptable — field sync cadence).
- `.lcpack` bundling (`scripts/export-lcpack.cjs`) refuses unsigned
  manifests, so ops can't accidentally ship an unverifiable pack.
- `crypto.subtle` Ed25519 needs Chrome/Edge ≥137 or Safari ≥17; older
  engines fall back to "unsigned manifests only" (`no_verification_key` on
  signed files, first-party fetch still works).
