import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsQueue } from '@/apps/web/lib/analytics/queue';

const STORAGE_KEY = 'lc_analytics_queue_v1';

const validLearningEvent = {
  event: 'learning' as const,
  action: 'lesson_started' as const,
  lesson_id: 'lesson-1',
};

type QueuedRow = { id: string; event: unknown; timestamp: number; retryCount: number };

function entries(q: AnalyticsQueue): QueuedRow[] {
  return (q as any).queue as QueuedRow[];
}

// The vitest environment has no localStorage; stub a minimal in-memory one.
function makeLocalStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe('AnalyticsQueue persisted-row resilience', () => {
  let store: ReturnType<typeof makeLocalStorage>;

  beforeEach(() => {
    store = makeLocalStorage();
    vi.stubGlobal('localStorage', store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('drops legacy rows persisted by older queue implementations', () => {
    // The pre-migration queue (root lib/analytics/queue.ts) stored a bare
    // array of LearningEvents under the same key, with `name` as the
    // discriminant instead of `event`.
    store.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'old-1', name: 'lesson_started', lesson_id: 'l1', timestamp: '2024-01-01T00:00:00Z' },
        { id: 'broken-1', timestamp: 1700000000000, retryCount: 0 },
        'not-an-object',
      ]),
    );

    const q = new AnalyticsQueue();
    expect(entries(q)).toHaveLength(0);
  });

  it('loads valid wrapped rows and heals unwrapped AnalyticsEvents', () => {
    store.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'w1', event: validLearningEvent, timestamp: 1700000000000, retryCount: 1 },
        validLearningEvent, // stored without the QueuedEvent wrapper
      ]),
    );

    const q = new AnalyticsQueue();
    const rows = entries(q);
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('w1');
    expect(rows[1].event).toMatchObject(validLearningEvent);
  });

  it('flush() resolves without throwing when the queue contains a malformed row', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const q = new AnalyticsQueue();
    (q as any).queue = [{ id: 'bad', timestamp: Date.now(), retryCount: 0 }];

    await expect(q.flush()).resolves.toBeUndefined();
    // Malformed row is evicted rather than wedging every future flush
    expect(entries(q)).toHaveLength(0);
  });

  it('flush() sends valid batches and evicts only malformed rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const q = new AnalyticsQueue();
    (q as any).queue = [
      { id: 'bad', timestamp: Date.now(), retryCount: 0 },
      { id: 'good', event: validLearningEvent, timestamp: Date.now(), retryCount: 0 },
    ];

    await expect(q.flush()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe('/api/analytics/learning');
    const payload = JSON.parse(init.body as string);
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0]).toMatchObject(validLearningEvent);
    expect(entries(q)).toHaveLength(0);
  });
});
