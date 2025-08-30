// Offline Analytics Event Queue
import { AnalyticsEvent, validateEvent } from './events';

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
    } finally {
      this.isProcessing = false;
    }
  }

  // Group events by type for efficient batch processing
  private groupEventsByType(events: QueuedEvent[]): Map<string, QueuedEvent[]> {
    const batches = new Map<string, QueuedEvent[]>();
    
    events.forEach(event => {
      const eventType = event.event.event;
      if (!batches.has(eventType)) {
        batches.set(eventType, []);
      }
      batches.get(eventType)!.push(event);
    });
    
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

  // Save queue to localStorage
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
      } catch (error) {
        console.warn('Failed to save analytics queue to storage:', error);
      }
    }
  }

  // Load queue from localStorage
  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.queue = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load analytics queue from storage:', error);
        this.queue = [];
      }
    }
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
