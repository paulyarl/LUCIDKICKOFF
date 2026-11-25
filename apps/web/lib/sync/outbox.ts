import { db, type OutboxRow } from '@/lib/offline/db';
import { backoffMs } from '@/lib/offline/networkPolicy';
import { isOnline, subscribeConnectivity } from '@/lib/offline/connectivity';

// S3.3 — client sync outbox. Mutations enqueue ops into the `outbox` IDB
// store; drainOutbox() POSTs them to /api/sync/batch, which dedupes on opId
// and enforces the guardian's cloud-sync consent (D32). Ops rejected for
// missing consent are dropped — they can be re-enqueued after the family
// grants consent. SW-driven draining lands in 3.4; this is the foreground
// path.

const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 50;

export type DrainResult = 'synced' | 'partial' | 'offline' | 'empty';

const newOpId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export async function enqueueOp(type: string, payload: unknown): Promise<void> {
  await db.outbox.add({
    opId: newOpId(),
    type,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  });
  void requestBackgroundSync();
}

/** Ask the SW to drain when connectivity returns (Chrome's SyncManager). */
async function requestBackgroundSync(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    await (reg as any).sync?.register('sync-artwork');
  } catch {
    // SyncManager unsupported or SW not ready — foreground drain covers it
  }
}

/**
 * S3.4/S3.9 — foreground fallback drain. Sync windows: drains on app start
 * and when the connectivity probe (not just `navigator.onLine`) reports a
 * verified online transition — captive portals and false NIC signals won't
 * trigger wasted drains.
 */
export function initOutboxSync(): () => void {
  const drain = () => {
    if (isOnline()) void drainOutbox().catch(() => {});
  };
  drain();
  const unsubscribe = subscribeConnectivity((c) => {
    if (c === 'online') drain();
  });
  window.addEventListener('online', drain);
  return () => {
    unsubscribe();
    window.removeEventListener('online', drain);
  };
}

/**
 * Resolve a conflicted artwork op. 'server' drops the local version;
 * 'local' re-enqueues it under a new storage key — the "keep both" path (S3.4).
 */
export async function resolveArtworkConflict(opId: string, resolution: 'server' | 'local'): Promise<void> {
  const row = await db.outbox.where('opId').equals(opId).first();
  if (!row?.id) return;
  if (resolution === 'server') {
    await db.outbox.delete(row.id);
    return;
  }
  const payload = { ...(row.payload as Record<string, unknown>) };
  payload.key = `${String(payload.key ?? 'drawing')}-copy-${Date.now()}`;
  await db.outbox.delete(row.id);
  await enqueueOp('artwork', payload);
  await drainOutbox().catch(() => {});
}

/**
 * POST pending ops to the ingest endpoint. Returns 'synced' when every op
 * settled (applied/duplicate/rejected), 'partial' when some failed or the
 * ingest errored, 'offline' when the request never reached the server.
 */
export async function drainOutbox(): Promise<DrainResult> {
  const now = Date.now();
  // Rows past the attempt cap are terminal — mark them once instead of
  // leaving them 'pending' forever.
  await db.outbox
    .where('status')
    .equals('pending')
    .and((row) => row.attempts >= MAX_ATTEMPTS)
    .modify({ status: 'failed', lastError: 'max attempts exceeded' });

  const pending = await db.outbox
    .where('status')
    .equals('pending')
    // S3.9 — eligible only when the backoff window has elapsed.
    .and((row) => (row.nextRetryAt ?? 0) <= now)
    .sortBy('createdAt');
  const batch = pending.slice(0, BATCH_SIZE);
  if (batch.length === 0) return 'empty';

  await db.outbox.where('id').anyOf(batch.map((r) => r.id!)).modify({ status: 'syncing' });

  let results: { opId: string; status: string; reason?: string }[] | null = null;
  try {
    const res = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ops: batch.map((r) => ({
          opId: r.opId,
          type: r.type,
          payloadVersion: 1,
          payload: r.payload,
        })),
      }),
    });
    if (res.status === 401 || res.status === 403) {
      // Not signed in — leave ops pending for a later authenticated drain.
      await db.outbox.where('id').anyOf(batch.map((r) => r.id!)).modify({ status: 'pending' });
      return 'partial';
    }
    if (res.ok) {
      const json = (await res.json()) as { results?: typeof results };
      results = json.results ?? null;
    }
  } catch {
    // offline — restore pending below
  }

  if (!results) {
    await db.outbox
      .where('id')
      .anyOf(batch.map((r) => r.id!))
      .modify((row: OutboxRow) => {
        row.status = 'pending';
        row.attempts += 1;
        row.nextRetryAt = Date.now() + backoffMs(row.attempts);
      });
    return 'offline';
  }

  const byOpId = new Map(results.map((r) => [r.opId, r]));
  let settled = true;
  for (const row of batch) {
    const res = byOpId.get(row.opId);
    if (!res) {
      settled = false;
      await db.outbox.update(row.id!, {
        status: 'pending',
        attempts: row.attempts + 1,
        nextRetryAt: Date.now() + backoffMs(row.attempts),
      });
      continue;
    }
    if (res.status === 'applied' || res.status === 'duplicate') {
      await db.outbox.delete(row.id!);
    } else if (res.status === 'rejected') {
      // Permanent (no consent, malformed, unsupported version) — drop it.
      await db.outbox.update(row.id!, {
        status: 'failed',
        lastError: res.reason ?? 'rejected',
      });
      if (res.reason === 'artwork_conflict') {
        // S3.4 — surface the conflict so ConflictResolver can offer keep-both.
        window.dispatchEvent(
          new CustomEvent('lc-sync-conflict', {
            detail: { opId: row.opId, payload: row.payload, serverUpdatedAt: (res as any).serverUpdatedAt },
          }),
        );
      }
    } else {
      settled = false;
      await db.outbox.update(row.id!, {
        status: 'pending',
        attempts: row.attempts + 1,
        nextRetryAt: Date.now() + backoffMs(row.attempts),
        lastError: res.reason ?? 'error',
      });
    }
  }
  return settled ? 'synced' : 'partial';
}

export async function outboxDepth(): Promise<number> {
  return db.outbox.where('status').equals('pending').count();
}
