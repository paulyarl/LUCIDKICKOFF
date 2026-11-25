import Dexie, { type Table } from 'dexie';

// Sprint 3.1 — IndexedDB schema (Dexie). Backs durability-critical data:
// lesson progress, canvas/artwork saves, entitlement cache, the sync
// outbox (3.3/3.4) and the analytics queue.

export interface ProgressRow {
  /** `lc-progress:${learnerKey}:${lessonId}` — keeps the legacy localStorage key shape. */
  key: string;
  learnerKey: string;
  lessonId: string;
  stepIndex: number;
  results: unknown;
  done: boolean;
  updatedAt: number;
}

export type TemplateCanvasStateV2 = { version: 2; lines: any[]; texts: any[] };

export interface StrokeRow {
  /** `tw:${owner}:${packId}:${templateId}` or `canvas:${storageKey}`. */
  key: string;
  kind: 'template' | 'canvas';
  ownerKey: string;
  packId?: string;
  templateId?: string;
  status?: 'in_progress' | 'completed';
  canvasState?: TemplateCanvasStateV2;
  /** Raw canvas payload for kind='canvas' rows. */
  payload?: unknown;
  startedAt?: number;
  updatedAt: number;
}

export interface EntitlementRow {
  /** `ent:${userId}` or `ent:anon`. */
  key: string;
  value: { templateIds: string[]; packIds: string[]; planCodes: string[] };
  updatedAt: number;
}

export interface OutboxRow {
  id?: number;
  /** Client-generated operation id — the ingest endpoint dedupes on it (3.3). */
  opId: string;
  type: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

export interface AnalyticsRow {
  /** uuid — matches QueuedEvent.id so flush deletes stay identity-stable. */
  id: string;
  event: unknown;
  timestamp: number;
  retryCount: number;
}

class LucidCraftDB extends Dexie {
  progress!: Table<ProgressRow, string>;
  strokes!: Table<StrokeRow, string>;
  entitlements!: Table<EntitlementRow, string>;
  outbox!: Table<OutboxRow, number>;
  analytics!: Table<AnalyticsRow, string>;

  constructor() {
    super('lucidcraft');
    this.version(1).stores({
      progress: 'key, learnerKey, lessonId, updatedAt',
      strokes: 'key, kind, ownerKey, [ownerKey+packId], updatedAt',
      entitlements: 'key',
      outbox: '++id, &opId, status, createdAt',
      analytics: 'id, timestamp',
    });
  }
}

export const db = new LucidCraftDB();
