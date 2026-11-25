// Offline Analytics Event Queue
import { AnalyticsEvent, AnalyticsEventSchema, validateEvent } from './events';
import { db } from '@/lib/offline/db';

interface QueuedEvent {
  id: string;
  event: AnalyticsEvent;
  timestamp: number;
  retryCount: number;
}

class AnalyticsQueue {
  private queue: QueuedEvent[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second
  private maxQueueSize = 1000;
  private storageKey = 'lc_analytics_queue_v1';

  constructor() {
    this.loadFromStorage();
    this.startPeriodicFlush();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush());
      window.addEventListener('beforeunload', () => this.saveToStorage());
    }
  }

  // Add event to queue
  enqueue(event: AnalyticsEvent) {
    try {
      // Validate event before queuing
      const validatedEvent = validateEvent(event);
      
      const queuedEvent: QueuedEvent = {
        id: crypto.randomUUID(),
        event: validatedEvent,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.queue.push(queuedEvent);
      
      // Prevent queue from growing too large
      if (this.queue.length > this.maxQueueSize) {
        this.queue = this.queue.slice(-this.maxQueueSize);
      }
      
      this.saveToStorage();
      
      // Try to flush immediately if online
      if (this.isOnline()) {
        this.flush();
      }
    } catch (error) {
      console.warn('Failed to enqueue analytics event:', error);
    }
  }

  // Process queue and send events
  async flush() {
    if (this.isProcessing || this.queue.length === 0 || !this.isOnline()) {
      return;
    }

    this.isProcessing = true;
    const eventsToProcess = [...this.queue];
    
    try {
      // Group events by type for batch sending
      const batches = this.groupEventsByType(eventsToProcess);
      if (batches.size === 0) {
        this.saveToStorage();
        return;
      }
      
      for (const [eventType, events] of batches) {
        try {
          await this.sendBatch(eventType, events);
          // Remove successfully sent events from queue
          this.queue = this.queue.filter(q => !events.some((e: QueuedEvent) => e.id === q.id));
        } catch (error) {
          console.warn(`Failed to send ${eventType} events:`, error);
          // Increment retry count for failed events
          events.forEach((event: QueuedEvent) => {
            const queuedEvent = this.queue.find(q => q.id === event.id);
            if (queuedEvent) {
              queuedEvent.retryCount++;
              // Remove events that have exceeded max retries
              if (queuedEvent.retryCount >= this.maxRetries) {
                this.queue = this.queue.filter(q => q.id !== event.id);
              }
            }
          });
        }
      }
      
      this.saveToStorage();
    } catch (error) {
      console.warn('Failed to flush analytics queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Group events by type for efficient batch processing.
  // Rows missing a typed event payload (e.g. restored from older persisted
  // data) are evicted from the queue instead of wedging every flush.
  private groupEventsByType(events: QueuedEvent[]): Map<string, QueuedEvent[]> {
    const batches = new Map<string, QueuedEvent[]>();
    const malformed = new Set<QueuedEvent>();
    
    events.forEach(event => {
      const eventType = event?.event?.event;
      if (typeof eventType !== 'string' || eventType.length === 0) {
        malformed.add(event);
        return;
      }
      if (!batches.has(eventType)) {
        batches.set(eventType, []);
      }
      batches.get(eventType)!.push(event);
    });
    
    if (malformed.size > 0) {
      this.queue = this.queue.filter(q => !malformed.has(q));
      console.warn(`Dropped ${malformed.size} malformed analytics event(s) from queue`);
    }
    
    return batches;
  }

  // Send batch of events to analytics endpoint
  private async sendBatch(eventType: string, events: QueuedEvent[]): Promise<void> {
    const endpoint = this.getEndpointForEventType(eventType);
    
    const payload = {
      events: events.map(e => e.event),
      batch_timestamp: Date.now(),
      batch_size: events.length,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Get appropriate endpoint for event type
  private getEndpointForEventType(eventType: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';
    
    switch (eventType) {
      case 'learning':
        return `${baseUrl}/learning`;
      case 'performance_metric':
        return `${baseUrl}/performance`;
      case 'error':
        return `${baseUrl}/errors`;
      default:
        return `${baseUrl}/events`;
    }
  }

  // Check if browser is online
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Periodic flush every 30 seconds
  private startPeriodicFlush() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.queue.length > 0) {
          this.flush();
        }
      }, 30000);
    }
  }

  // Save queue to IndexedDB (localStorage fallback when IDB is unavailable)
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    if (typeof indexedDB !== 'undefined') {
      void db.analytics
        .clear()
        .then(() =>
          this.queue.length
            ? db.analytics.bulkPut(
                this.queue.map((q) => ({
                  id: q.id,
                  event: q.event,
                  timestamp: q.timestamp,
                  retryCount: q.retryCount,
                })),
              )
            : undefined,
        )
        .catch((error) => console.warn('Failed to save analytics queue to storage:', error));
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save analytics queue to storage:', error);
    }
  }

  // Normalize a persisted row back into a QueuedEvent. Older builds of this
  // queue persisted different shapes under the same storage key — bare
  // AnalyticsEvents and pre-migration QueueItems — so the candidate payload
  // is schema-validated before being queued; anything that fails is dropped
  // so a bad row can't wedge flush() forever.
  private toQueuedEvent(row: unknown): QueuedEvent | null {
    if (!row || typeof row !== 'object') return null;
    const r = row as { id?: unknown; event?: unknown; timestamp?: unknown; retryCount?: unknown };
    // Wrapped rows carry the payload under `event`; unwrapped rows are the
    // event themselves.
    const candidate = r.event && typeof r.event === 'object' ? r.event : row;
    const parsed = AnalyticsEventSchema.safeParse(candidate);
    if (!parsed.success) return null;
    return {
      id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
      event: parsed.data,
      timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now(),
      retryCount: typeof r.retryCount === 'number' ? r.retryCount : 0,
    };
  }

  // Load queue: IndexedDB first, then one-time import of legacy localStorage rows
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    if (typeof indexedDB === 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.queue = this.normalizeRows(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load analytics queue from storage:', error);
        this.queue = [];
      }
      return;
    }
    void (async () => {
      try {
        const rows = await db.analytics.toArray();
        this.queue = this.normalizeRows(rows);
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          localStorage.removeItem(this.storageKey);
          const legacy = this.normalizeRows(JSON.parse(stored));
          if (legacy.length) {
            const known = new Set(this.queue.map((q) => q.id));
            this.queue = [
              ...this.queue,
              ...legacy.filter((e) => !known.has(e.id)),
            ].slice(-this.maxQueueSize);
            this.saveToStorage();
          }
        }
      } catch (error) {
        console.warn('Failed to load analytics queue from storage:', error);
      }
    })();
  }

  private normalizeRows(rows: unknown): QueuedEvent[] {
    if (!Array.isArray(rows)) return [];
    const normalized: QueuedEvent[] = [];
    let dropped = 0;
    for (const row of rows) {
      const q = this.toQueuedEvent(row);
      if (q) normalized.push(q);
      else dropped++;
    }
    if (dropped > 0) {
      console.warn(`Dropped ${dropped} malformed persisted analytics event(s)`);
    }
    return normalized;
  }

  // Get queue status for debugging
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      isOnline: this.isOnline(),
      oldestEvent: this.queue.length > 0 ? new Date(this.queue[0].timestamp) : null,
    };
  }

  // Clear queue (for testing)
  clear() {
    this.queue = [];
    this.saveToStorage();
  }
}

// Export singleton instance
export const analyticsQueue = new AnalyticsQueue();

// Export for testing
export { AnalyticsQueue };
