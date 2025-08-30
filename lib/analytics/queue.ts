import { LearningEvent, isLearningEventArray } from './events';

type QueueConfig = {
  maxQueueSize?: number;
  flushInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
};

type QueueItem = {
  event: LearningEvent;
  retryCount: number;
  lastAttempt?: Date;
};

const STORAGE_KEY = 'lc_analytics_queue_v1';
const DEFAULT_CONFIG: Required<QueueConfig> = {
  maxQueueSize: 1000,
  flushInterval: 30000, // 30 seconds
  maxRetries: 5,
  retryDelay: 5000, // 5 seconds
};

export class AnalyticsQueue {
  private queue: QueueItem[] = [];
  private isFlushing = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private config: Required<QueueConfig>;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private endpoint: string;

  constructor(endpoint: string, config: QueueConfig = {}) {
    this.endpoint = endpoint;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
    this.setupListeners();
    this.startFlushTimer();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('beforeunload', this.flushSync);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.flush();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  private startFlushTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      if (this.isOnline) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isLearningEventArray(parsed)) {
          this.queue = parsed.map(event => ({
            event,
            retryCount: 0,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load analytics queue from storage:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const events = this.queue.map(({ event }) => event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save analytics queue to storage:', error);
    }
  }

  async enqueue(event: LearningEvent): Promise<boolean> {
    if (this.queue.length >= this.config.maxQueueSize) {
      console.warn('Analytics queue full, dropping event');
      return false;
    }

    this.queue.push({
      event,
      retryCount: 0,
    });

    this.saveToStorage();

    if (this.isOnline) {
      await this.flush();
    }

    return true;
  }

  private getBatchByType(): Record<string, LearningEvent[]> {
    const batches: Record<string, LearningEvent[]> = {};

    for (const { event } of this.queue) {
      if (!batches[event.name]) {
        batches[event.name] = [];
      }
      batches[event.name].push(event);
    }

    return batches;
  }

  private async sendBatch(events: LearningEvent[]): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (this.isFlushing || !this.isOnline || this.queue.length === 0) {
      return false;
    }

    this.isFlushing = true;

    try {
      const batches = this.getBatchByType();
      const batchPromises = Object.entries(batches).map(async ([, events]) => {
        return this.sendBatch(events);
      });

      const results = await Promise.all(batchPromises);
      const allSucceeded = results.every(success => success);

      if (allSucceeded) {
        this.queue = [];
        this.saveToStorage();
      } else {
        this.handleBatchFailure();
      }

      return allSucceeded;
    } catch (error) {
      console.error('Error during analytics flush:', error);
      this.handleBatchFailure();
      return false;
    } finally {
      this.isFlushing = false;
    }
  }

  private handleBatchFailure() {
    const now = new Date();
    const retryable: QueueItem[] = [];
    const failed: QueueItem[] = [];

    for (const item of this.queue) {
      if (item.retryCount >= this.config.maxRetries) {
        failed.push(item);
        continue;
      }

      // Apply exponential backoff
      const lastAttempt = item.lastAttempt?.getTime() || 0;
      const backoff = Math.min(
        this.config.retryDelay * Math.pow(2, item.retryCount),
        300000, // 5 minutes max
      );

      if (now.getTime() - lastAttempt >= backoff) {
        item.retryCount++;
        item.lastAttempt = now;
        retryable.push(item);
      } else {
        retryable.push(item);
      }
    }

    if (failed.length > 0) {
      console.warn(`Dropping ${failed.length} analytics events after max retries`);
    }

    this.queue = retryable;
    this.saveToStorage();
  }

  async flushSync() {
    if (typeof window === 'undefined') return false;
    
    // Use sendBeacon for best-effort delivery during page unload
    if (this.queue.length > 0) {
      const events = this.queue.map(({ event }) => event);
      const blob = new Blob([JSON.stringify(events)], {
        type: 'application/json',
      });
      
      const success = navigator.sendBeacon(this.endpoint, blob);
      if (success) {
        this.queue = [];
        this.saveToStorage();
      }
      return success;
    }
    return true;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      window.removeEventListener('beforeunload', this.flushSync);
    }
  }
}

// Singleton instance
let analyticsQueue: AnalyticsQueue | null = null;

export function getAnalyticsQueue(endpoint: string, config?: QueueConfig): AnalyticsQueue {
  if (!analyticsQueue) {
    analyticsQueue = new AnalyticsQueue(endpoint, config);
  }
  return analyticsQueue;
}

export function destroyAnalyticsQueue() {
  if (analyticsQueue) {
    analyticsQueue.destroy();
    analyticsQueue = null;
  }
}
