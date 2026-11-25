/*
Sprint 3.2 — local-first persistence on IndexedDB (Dexie).
Supersedes the legacy localStorage adapter at the repo-root lib/learn/persistence
(this file shadows it via the app-first "@/lib" alias). All functions no-op
outside the browser and import legacy localStorage data on first access.
*/
import { db, type StrokeRow, type TemplateCanvasStateV2 } from '@/lib/offline/db';

export type { TemplateCanvasStateV2 };

export type TemplateWork = {
  packId: string;
  templateId: string;
  status: 'in_progress' | 'completed';
  startedAt: number;
  updatedAt: number;
  canvasState?: TemplateCanvasStateV2;
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

const ownerOf = (userKey: string | undefined) => userKey ?? 'anon';
const twKey = (owner: string, packId: string, templateId: string) =>
  `tw:${owner}:${packId}:${templateId}`;

function rowToWork(row: StrokeRow): TemplateWork {
  return {
    packId: row.packId!,
    templateId: row.templateId!,
    status: row.status ?? 'in_progress',
    startedAt: row.startedAt ?? row.updatedAt,
    updatedAt: row.updatedAt,
    canvasState: row.canvasState,
  };
}

// One-time import of the legacy `lk_template_work_v1` localStorage map.
let legacyTwImported = false;
async function migrateLegacyTemplateWork() {
  if (legacyTwImported || !isBrowser()) return;
  legacyTwImported = true;
  try {
    const raw = localStorage.getItem('lk_template_work_v1');
    if (!raw) return;
    const dict = JSON.parse(raw) as Record<
      string,
      Record<string, Record<string, TemplateWork>>
    >;
    const rows: StrokeRow[] = [];
    for (const [owner, byPack] of Object.entries(dict)) {
      for (const [packId, byTemplate] of Object.entries(byPack ?? {})) {
        for (const [templateId, w] of Object.entries(byTemplate ?? {})) {
          rows.push({
            key: twKey(owner, packId, templateId),
            kind: 'template',
            ownerKey: owner,
            packId,
            templateId,
            status: w.status,
            canvasState: w.canvasState,
            startedAt: w.startedAt,
            updatedAt: w.updatedAt,
          });
        }
      }
    }
    if (rows.length) await db.strokes.bulkPut(rows);
    localStorage.removeItem('lk_template_work_v1');
  } catch {
    // Malformed legacy blob — leave it in place rather than lose data
    legacyTwImported = false;
  }
}

// ---- Template work (per user -> pack -> template) ----

export async function saveTemplateWork(userKey: string | undefined, work: TemplateWork) {
  if (!isBrowser()) return;
  const owner = ownerOf(userKey);
  await db.strokes.put({
    key: twKey(owner, work.packId, work.templateId),
    kind: 'template',
    ownerKey: owner,
    packId: work.packId,
    templateId: work.templateId,
    status: work.status,
    canvasState: work.canvasState,
    startedAt: work.startedAt,
    updatedAt: Date.now(),
  });
}

export async function loadTemplateWork(
  userKey: string | undefined,
  packId: string,
  templateId: string,
): Promise<TemplateWork | undefined> {
  if (!isBrowser()) return undefined;
  await migrateLegacyTemplateWork();
  const row = await db.strokes.get(twKey(ownerOf(userKey), packId, templateId));
  return row?.kind === 'template' ? rowToWork(row) : undefined;
}

export async function listAllTemplateWork(userKey: string | undefined): Promise<TemplateWork[]> {
  if (!isBrowser()) return [];
  await migrateLegacyTemplateWork();
  const rows = await db.strokes.where('ownerKey').equals(ownerOf(userKey)).toArray();
  return rows
    .filter((r) => r.kind === 'template')
    .map(rowToWork)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listTemplateWorkForPack(
  userKey: string | undefined,
  packId: string,
): Promise<TemplateWork[]> {
  if (!isBrowser()) return [];
  await migrateLegacyTemplateWork();
  const rows = await db.strokes
    .where('[ownerKey+packId]')
    .equals([ownerOf(userKey), packId])
    .toArray();
  return rows
    .filter((r) => r.kind === 'template')
    .map(rowToWork)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteTemplateWork(
  userKey: string | undefined,
  packId: string,
  templateId: string,
) {
  if (!isBrowser()) return;
  await db.strokes.delete(twKey(ownerOf(userKey), packId, templateId));
}

// ---- Canvas scratch buffer (`lc_guest_canvas_v1` / `lc_user_canvas_<id>`) ----

const canvasKey = (storageKey: string) => `canvas:${storageKey}`;

export async function saveCanvasPayload(storageKey: string, payload: unknown) {
  if (!isBrowser()) return;
  await db.strokes.put({
    key: canvasKey(storageKey),
    kind: 'canvas',
    ownerKey: 'canvas',
    payload,
    updatedAt: Date.now(),
  });
}

export async function loadCanvasPayload(storageKey: string): Promise<unknown> {
  if (!isBrowser()) return null;
  try {
    const row = await db.strokes.get(canvasKey(storageKey));
    if (row) return row.payload ?? null;
    // legacy localStorage import
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const payload = JSON.parse(raw);
      await saveCanvasPayload(storageKey, payload);
      localStorage.removeItem(storageKey);
      return payload;
    }
  } catch {}
  return null;
}

export async function deleteCanvasPayload(storageKey: string) {
  if (!isBrowser()) return;
  await db.strokes.delete(canvasKey(storageKey));
  try {
    localStorage.removeItem(storageKey);
  } catch {}
}

export async function moveCanvasPayload(fromKey: string, toKey: string): Promise<boolean> {
  const payload = await loadCanvasPayload(fromKey);
  if (payload == null) return false;
  await saveCanvasPayload(toKey, payload);
  await deleteCanvasPayload(fromKey);
  return true;
}

// ---- Lesson progress snapshots (`lc-progress:<learner>:<lesson>`) ----

export type ProgressSnapshot = {
  stepIndex: number;
  results: unknown;
  done: boolean;
  updatedAt: number;
};

export async function saveProgressSnapshot(key: string, snapshot: ProgressSnapshot) {
  if (!isBrowser()) return;
  const [, learnerKey = 'anon', ...rest] = key.split(':');
  await db.progress.put({
    key,
    learnerKey,
    lessonId: rest.join(':'),
    stepIndex: snapshot.stepIndex,
    results: snapshot.results,
    done: snapshot.done,
    updatedAt: snapshot.updatedAt,
  });
}

export async function loadProgressSnapshot(key: string): Promise<ProgressSnapshot | null> {
  if (!isBrowser()) return null;
  try {
    const row = await db.progress.get(key);
    if (row) {
      return {
        stepIndex: row.stepIndex,
        results: row.results,
        done: row.done,
        updatedAt: row.updatedAt,
      };
    }
    // legacy localStorage import
    const raw = localStorage.getItem(key);
    if (raw) {
      const snapshot = JSON.parse(raw) as ProgressSnapshot;
      await saveProgressSnapshot(key, snapshot);
      localStorage.removeItem(key);
      return snapshot;
    }
  } catch {}
  return null;
}
