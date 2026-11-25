// S3.5 — pack manifest signature verification (D33, ADR-001).
//
// Manifests are signed with Ed25519 over the canonical JSON form (sorted
// keys, signature fields stripped). The public key is embedded — an
// attacker who can modify manifest.json on the static host cannot forge a
// signature without the private key held in the export environment.
//
// Policy:
//   - signature present → MUST verify (a forged/bad signature fails hard)
//   - signature absent + first-party fetch → accepted (HTTPS origin trust)
//   - manual .lcpack import → signature REQUIRED (field devices, D33)

/** Ed25519 public key (SPKI, base64) — generate the pair via `node scripts/gen-pack-key.cjs`. */
export const PACK_PUBLIC_KEY_SPKI_B64 = process.env.NEXT_PUBLIC_PACK_PUBLIC_KEY ?? '';

export const canonicalize = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`);
  return `{${entries.join(',')}}`;
};

const SIGNING_FIELDS = new Set(['signature', 'keyId']);

export const canonicalManifestPayload = (manifest: Record<string, unknown>): string => {
  const stripped = Object.fromEntries(
    Object.entries(manifest).filter(([k]) => !SIGNING_FIELDS.has(k)),
  );
  return canonicalize(stripped);
};

const hexToBytes = (hex: string) => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

let keyPromise: Promise<CryptoKey> | null = null;
const getPublicKey = () => {
  keyPromise ??= crypto.subtle
    .importKey('spki', b64ToBytes(PACK_PUBLIC_KEY_SPKI_B64), { name: 'Ed25519' }, false, ['verify'])
    .catch((e) => {
      keyPromise = null;
      throw e;
    });
  return keyPromise;
};

export const ed25519Supported = (): boolean =>
  typeof crypto !== 'undefined' && !!crypto.subtle && !!PACK_PUBLIC_KEY_SPKI_B64;

export type VerifyResult =
  | { ok: true; signed: boolean }
  | { ok: false; reason: string };

/**
 * Verify a manifest's signature if present.
 * `require` = manual imports — unsigned manifests are rejected outright.
 */
export async function verifyManifest(
  manifest: Record<string, unknown>,
  { require = false }: { require?: boolean } = {},
): Promise<VerifyResult> {
  const signature = manifest.signature;
  if (typeof signature !== 'string' || !signature) {
    return require
      ? { ok: false, reason: 'unsigned_manifest' }
      : { ok: true, signed: false };
  }
  if (!ed25519Supported()) {
    return { ok: false, reason: 'no_verification_key' };
  }
  try {
    const key = await getPublicKey();
    const payload = new TextEncoder().encode(canonicalManifestPayload(manifest));
    // Signature is stored as base64 of raw Ed25519 bytes (or hex for older exports).
    const sigBytes = signature.length === 128 ? hexToBytes(signature) : b64ToBytes(signature);
    const valid = await crypto.subtle.verify({ name: 'Ed25519' }, key, sigBytes, payload);
    return valid ? { ok: true, signed: true } : { ok: false, reason: 'bad_signature' };
  } catch {
    return { ok: false, reason: 'verify_error' };
  }
}
