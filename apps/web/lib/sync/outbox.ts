import { db, type OutboxRow } from '@/lib/offline/db';

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
}

/**
 * POST pending ops to the ingest endpoint. Returns 'synced' when every op
 * settled (applied/duplicate/rejected), 'partial' when some failed or the
 * ingest errored, 'offline' when the request never reached the server.
 */
export async function drainOutbox(): Promise<DrainResult> {
  const pending = await db.outbox
    .where('status')
    .equals('pending')
    .and((row) => row.attempts < MAX_ATTEMPTS)
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
      });
    return 'offline';
  }

  const byOpId = new Map(results.map((r) => [r.opId, r]));
  let settled = true;
  for (const row of batch) {
    const res = byOpId.get(row.opId);
    if (!res) {
      settled = false;
      await db.outbox.update(row.id!, { status: 'pending', attempts: row.attempts + 1 });
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
    } else {
      settled = false;
      await db.outbox.update(row.id!, {
        status: 'pending',
        attempts: row.attempts + 1,
        lastError: res.reason ?? 'error',
      });
    }
  }
  return settled ? 'synced' : 'partial';
}

export async function outboxDepth(): Promise<number> {
  return db.outbox.where('status').equals('pending').count();
}
