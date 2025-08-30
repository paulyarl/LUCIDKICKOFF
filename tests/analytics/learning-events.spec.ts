import { test, expect, type Page, type Browser } from '@playwright/test';
import type { LearningEvent } from '@/lib/analytics/events';

// Type guards for specific event types
function isLessonStartedEvent(event: LearningEvent): event is Extract<LearningEvent, { name: 'lesson_started' }> {
  return event.name === 'lesson_started';
}

function isCheckpointPassedEvent(event: LearningEvent): event is Extract<LearningEvent, { name: 'checkpoint_passed' }> {
  return event.name === 'checkpoint_passed';
}

function isLessonCompletedEvent(event: LearningEvent): event is Extract<LearningEvent, { name: 'lesson_completed' }> {
  return event.name === 'lesson_completed';
}

function isStepAttemptedEvent(event: LearningEvent): event is Extract<LearningEvent, { name: 'step_attempted' }> {
  return event.name === 'step_attempted';
}

// Extend the Window interface to include our mock functions
declare global {
  interface Window {
    __analyticsEvents: LearningEvent[];
    __analyticsQueue: {
      enqueue: (event: LearningEvent) => Promise<boolean>;
      flush: () => Promise<boolean>;
      clear: () => void;
    };
    trackLessonStarted: (params: {
      lessonId: string;
      lessonTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }) => Promise<boolean>;
    trackStepAttempted: (params: {
      lessonId: string;
      stepId: string;
      stepIndex: number;
      isCorrect: boolean;
      score: number;
      stars: number;
      hintsUsed: number;
      attemptDurationMs: number;
      strokes?: Array<Array<{ x: number; y: number }>>;
    }) => Promise<boolean>;
    trackCheckpointPassed: (params: {
      tutorialId: string;
      checkpointId: string;
      checkpointIndex: number;
      attemptCount: number;
      completionTimeMs: number;
    }) => Promise<boolean>;
    trackLessonCompleted: (params: {
      lessonId: string;
      totalSteps: number;
      completedSteps: number;
      totalDurationMs: number;
      averageScore: number;
      starsEarned: number;
    }) => Promise<boolean>;
    trackTutorialCompleted: (params: {
      tutorialId: string;
      totalLessons: number;
      completedLessons: number;
      totalDurationMs: number;
      averageScore: number;
    }) => Promise<boolean>;
  }
}

// Mock the analytics queue in the browser context
async function setupAnalyticsMock(page: Page) {
  await page.addInitScript(() => {
    // Store captured events
    window.__analyticsEvents = [];
    
    // Mock the analytics queue
    window.__analyticsQueue = {
      enqueue: async (event: LearningEvent) => {
        window.__analyticsEvents.push(event);
        return true;
      },
      flush: async () => true,
      clear: () => {
        window.__analyticsEvents = [];
      }
    };
  });
}

// Helper to get captured events from the browser
async function getCapturedEvents(page: Page): Promise<LearningEvent[]> {
  return page.evaluate(() => window.__analyticsEvents || []);
}

// Helper to clear captured events
async function clearCapturedEvents(page: Page) {
  await page.evaluate(() => {
    window.__analyticsEvents = [];
  });
}

test.describe('Learning Analytics Events', () => {
  let page: Page;
  let browser: Browser;
  
  test.beforeAll(async ({ browser: b }: { browser: Browser }) => {
    browser = b;
  });

  // Helper to create a base event with required fields
  function createBaseEvent<T extends LearningEvent['name']>(name: T): Omit<LearningEvent, 'name'> & { name: T } {
    return {
      id: 'test-id',
      name,
      timestamp: new Date().toISOString(),
      session_id: 'test-session',
      schema_version: '1.0.0',
      user_id: 'test-user'
    } as Omit<LearningEvent, 'name'> & { name: T };
  }
  
  test.beforeEach(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await setupAnalyticsMock(page);
  });
  
  test.afterEach(async () => {
    await page.close();
  });
  
  test.afterAll(async () => {
    await browser.close();
  });

  test('should track lesson_started event', async () => {
    // Mock the trackLessonStarted function
    await page.addInitScript(() => {
      // This will run in the browser context
      window.trackLessonStarted = async (params: {
        lessonId: string;
        lessonTitle: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
      }) => {
        const event = {
          ...createBaseEvent('lesson_started'),
          lesson_id: params.lessonId,
          lesson_title: params.lessonTitle,
          difficulty: params.difficulty
        };
        return window.__analyticsQueue.enqueue(event as LearningEvent);
      };
    });
    
    // Trigger the event
    await page.evaluate(async () => {
      await window.trackLessonStarted({
        lessonId: 'lesson-1',
        lessonTitle: 'Basic Shapes',
        difficulty: 'beginner'
      });
    });
    
    // Verify the event was captured
    const events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    
    const event = events[0];
    expect(event.name).toBe('lesson_started');
    
    // Use type assertion since we've verified the name
    if (isLessonStartedEvent(event)) {
      expect(event.lesson_id).toBe('lesson-1');
      expect(event.lesson_title).toBe('Basic Shapes');
      expect(event.difficulty).toBe('beginner');
      expect(event.session_id).toBeDefined();
      expect(event.timestamp).toBeDefined();
    }
  });
  
  test('should track step_attempted with stroke data', async () => {
    // Mock the trackStepAttempted function
    await page.addInitScript(() => {
      window.trackStepAttempted = async (params: {
        lessonId: string;
        stepId: string;
        stepIndex: number;
        isCorrect: boolean;
        score: number;
        stars: number;
        hintsUsed: number;
        attemptDurationMs: number;
        strokes?: Array<Array<{x: number, y: number}>>;
      }) => {
        const event: Extract<LearningEvent, { name: 'step_attempted' }> = {
          ...createBaseEvent('step_attempted'),
          lesson_id: params.lessonId,
          step_id: params.stepId,
          step_index: params.stepIndex,
          is_correct: params.isCorrect,
          score: params.score,
          stars: params.stars,
          hints_used: params.hintsUsed,
          attempt_duration_ms: params.attemptDurationMs,
          stroke_data: {
            stroke_count: params.strokes?.length || 0,
            avg_stroke_length: 100, // Mock value
            total_draw_time_ms: 1000 // Mock value
          }
        };
        return window.__analyticsQueue.enqueue(event);
      };
    });
    
    // Mock stroke data
    const strokes: Array<Array<{x: number, y: number}>> = [
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      [{ x: 200, y: 200 }, { x: 300, y: 300 }]
    ];
    
    // Trigger the event
    await page.evaluate(async (strokeData: Array<Array<{x: number, y: number}>>) => {
      await window.trackStepAttempted({
        lessonId: 'lesson-1',
        stepId: 'step-1',
        stepIndex: 0,
        isCorrect: true,
        score: 0.9,
        stars: 3,
        hintsUsed: 1,
        attemptDurationMs: 5000,
        strokes: strokeData
      });
    }, strokes);
    
    // Verify the event
    const events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    
    const event = events[0];
    expect(event.name).toBe('step_attempted');

    if (isStepAttemptedEvent(event)) {
      expect(event.lesson_id).toBe('lesson-1');
      expect(event.step_id).toBe('step-1');
      expect(event.step_index).toBe(0);
      expect(event.is_correct).toBe(true);
      expect(event.score).toBe(0.9);
      expect(event.stars).toBe(3);
      expect(event.hints_used).toBe(1);
      expect(event.attempt_duration_ms).toBe(5000);
      
      // Verify stroke aggregates
      expect(event.stroke_data).toBeDefined();
      if (event.stroke_data) {
        expect(event.stroke_data.stroke_count).toBe(2);
        expect(event.stroke_data.avg_stroke_length).toBe(100);
        expect(event.stroke_data.total_draw_time_ms).toBe(1000);
      }
    }
  });
  
  test('should track checkpoint_passed event', async () => {
    // Mock the trackCheckpointPassed function
    await page.addInitScript(() => {
      window.trackCheckpointPassed = async (params: {
        tutorialId: string;
        checkpointId: string;
        checkpointIndex: number;
        attemptCount: number;
        completionTimeMs: number;
      }) => {
        const event: LearningEvent = {
          ...createBaseEvent('checkpoint_passed'),
          tutorial_id: params.tutorialId,
          checkpoint_id: params.checkpointId,
          checkpoint_index: params.checkpointIndex,
          attempt_count: params.attemptCount,
          completion_time_ms: params.completionTimeMs
        };
        return window.__analyticsQueue.enqueue(event as LearningEvent);
      };
    });
    
    // Trigger the event
    await page.evaluate(async () => {
      await window.trackCheckpointPassed({
        tutorialId: 'tutorial-1',
        checkpointId: 'checkpoint-1',
        checkpointIndex: 2,
        attemptCount: 1,
        completionTimeMs: 120000
      });
    });
    
    // Verify the event
    const events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    
    const event = events[0];
    expect(event.name).toBe('checkpoint_passed');
    if (isCheckpointPassedEvent(event)) {
      expect(event.tutorial_id).toBe('tutorial-1');
      expect(event.checkpoint_id).toBe('checkpoint-1');
      expect(event.checkpoint_index).toBe(2);
      expect(event.attempt_count).toBe(1);
      expect(event.completion_time_ms).toBe(120000);
    }
  });
  
  test('should track lesson_completed event', async () => {
    // Mock the trackLessonCompleted function
    await page.addInitScript(() => {
      window.trackLessonCompleted = async (params: {
        lessonId: string;
        totalSteps: number;
        completedSteps: number;
        totalDurationMs: number;
        averageScore: number;
        starsEarned: number;
      }) => {
        const event: LearningEvent = {
          ...createBaseEvent('lesson_completed'),
          lesson_id: params.lessonId,
          total_steps: params.totalSteps,
          completed_steps: params.completedSteps,
          total_duration_ms: params.totalDurationMs,
          average_score: params.averageScore,
          stars_earned: params.starsEarned
        };
        return window.__analyticsQueue.enqueue(event as LearningEvent);
      };
    });
    
    // Trigger the event
    await page.evaluate(async () => {
      await window.trackLessonCompleted({
        lessonId: 'lesson-1',
        totalSteps: 10,
        completedSteps: 10,
        totalDurationMs: 300000, // 5 minutes
        averageScore: 0.95,
        starsEarned: 3
      });
    });
    
    // Verify the event
    const events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    
    const event = events[0];
    expect(event.name).toBe('lesson_completed');
    if (isLessonCompletedEvent(event)) {
      expect(event.lesson_id).toBe('lesson-1');
      expect(event.total_steps).toBe(10);
      expect(event.completed_steps).toBe(10);
      expect(event.total_duration_ms).toBe(300000);
      expect(event.average_score).toBe(0.95);
      expect(event.stars_earned).toBe(3);
    }
  });
  
  test('should track tutorial_completed event', async () => {
    // Mock the trackTutorialCompleted function
    await page.addInitScript(() => {
      window.trackTutorialCompleted = async (params: {
        tutorialId: string;
        totalLessons: number;
        completedLessons: number;
        totalDurationMs: number;
        averageScore: number;
      }) => {
        const event: LearningEvent = {
          ...createBaseEvent('tutorial_completed'),
          tutorial_id: params.tutorialId,
          total_lessons: params.totalLessons,
          completed_lessons: params.completedLessons,
          total_duration_ms: params.totalDurationMs,
          average_score: params.averageScore
        };
        return window.__analyticsQueue.enqueue(event as LearningEvent);
      };
    });
    
    // Trigger the event
    await page.evaluate(async () => {
      await window.trackTutorialCompleted({
        tutorialId: 'tutorial-1',
        totalLessons: 5,
        completedLessons: 5,
        totalDurationMs: 1800000, // 30 minutes
        averageScore: 0.9
      });
    });
    
    // Verify the event
    const events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    
    const event = events[0];
    expect(event.name).toBe('tutorial_completed');
    if (event.name === 'tutorial_completed') {
      expect(event.tutorial_id).toBe('tutorial-1');
      expect(event.total_lessons).toBe(5);
      expect(event.completed_lessons).toBe(5);
      expect(event.total_duration_ms).toBe(1800000);
      expect(event.average_score).toBe(0.9);
    }
  });
  
  test('should not include raw stroke data in events', async () => {
    // Mock the trackStepAttempted function
    await page.addInitScript(() => {
      window.trackStepAttempted = async (params: {
        lessonId: string;
        stepId: string;
        stepIndex: number;
        isCorrect: boolean;
        score: number;
        stars: number;
        hintsUsed: number;
        attemptDurationMs: number;
        strokes?: Array<Array<{x: number, y: number}>>;
      }) => {
        const { strokes, ...rest } = params;
        const event: Extract<LearningEvent, { name: 'step_attempted' }> = {
          ...createBaseEvent('step_attempted'),
          lesson_id: rest.lessonId,
          step_id: rest.stepId,
          step_index: rest.stepIndex,
          is_correct: rest.isCorrect,
          score: rest.score,
          stars: rest.stars,
          hints_used: rest.hintsUsed,
          attempt_duration_ms: rest.attemptDurationMs,
          stroke_data: {
            stroke_count: strokes?.length || 0,
            avg_stroke_length: 100, // Mock
            total_draw_time_ms: 1000 // Mock
          }
        };
        return window.__analyticsQueue.enqueue(event);
      };
    });
    
    // Mock stroke data
    const strokes: Array<Array<{x: number, y: number}>> = [
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      [{ x: 200, y: 200 }, { x: 300, y: 300 }]
    ];
    
    // Trigger the event
    await page.evaluate(async (strokeData: Array<Array<{x: number, y: number}>>) => {
      await window.trackStepAttempted({
        lessonId: 'lesson-1',
        stepId: 'step-1',
        stepIndex: 0,
        isCorrect: true,
        score: 0.9,
        stars: 3,
        hintsUsed: 1,
        attemptDurationMs: 5000,
        strokes: strokeData
      });
    }, strokes);
    
    // Verify the event
    const events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    
    const event = events[0];
    if (isStepAttemptedEvent(event)) {
      expect(event).not.toHaveProperty('strokes');
      expect(event.stroke_data).toBeDefined();
      if (event.stroke_data) {
        expect(event.stroke_data.stroke_count).toBe(2);
      }
    }
  });
  
  test('should handle offline queuing', async () => {
    // Mock the analytics queue to simulate offline behavior
    await page.addInitScript(() => {
      let isOnline = false;
      
      // Override the queue to simulate offline behavior
      const originalEnqueue = window.__analyticsQueue.enqueue;
      window.__analyticsQueue.enqueue = async (event: LearningEvent) => {
        if (!isOnline) {
          // In a real implementation, this would be stored in localStorage
          window.__analyticsEvents.push({ ...event, _queuedOffline: true } as any);
          return false;
        }
        return originalEnqueue.call(window.__analyticsQueue, event);
      };
      
      // Mock the trackLessonStarted function
      window.trackLessonStarted = async (params: {
        lessonId: string;
        lessonTitle: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
      }) => {
        const event: Extract<LearningEvent, { name: 'lesson_started' }> = {
          ...createBaseEvent('lesson_started'),
          lesson_id: params.lessonId,
          lesson_title: params.lessonTitle,
          difficulty: params.difficulty
        };
        return window.__analyticsQueue.enqueue(event);
      };
      
      // Add a method to simulate coming back online
      (window as any).__setOnline = (online: boolean) => {
        isOnline = online;
        if (online) {
          // Process queued events
          const queuedEvents = window.__analyticsEvents.filter((e: any) => e._queuedOffline);
          window.__analyticsEvents = window.__analyticsEvents.filter((e: any) => !e._queuedOffline);
          queuedEvents.forEach((e: any) => {
            delete e._queuedOffline;
            window.__analyticsQueue.enqueue(e);
          });
        }
      };
    });
    
    // Go offline and send an event
    await page.evaluate(() => (window as any).__setOnline(false));
    
    await page.evaluate(async () => {
      await window.trackLessonStarted({
        lessonId: 'offline-lesson',
        lessonTitle: 'Offline Test',
        difficulty: 'intermediate'
      });
    });
    
    // Verify the event was queued
    let events: any[] = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    expect(events[0]._queuedOffline).toBe(true);
    
    // Go back online
    await page.evaluate(() => (window as any).__setOnline(true));
    
    // Verify the event was processed
    events = await getCapturedEvents(page);
    expect(events).toHaveLength(1);
    expect(events[0]._queuedOffline).toBeUndefined();
    expect(events[0].name).toBe('lesson_started');
    if (isLessonStartedEvent(events[0])) {
      expect(events[0].lesson_id).toBe('offline-lesson');
    }
  });

  test('should fire checkpoint_passed event in tutorial', async () => {
    await page.goto('/learn/tutorial/portrait-basics');
    await page.waitForSelector('[data-testid="tutorial-runner"]');
    
    // Complete all steps in first checkpoint
    const steps = await page.locator('[data-testid="tutorial-step"]').count();
    
    for (let i = 0; i < steps; i++) {
      // Simulate completing each step
      await page.locator('[data-testid="drawing-canvas"]').click();
      await page.locator('[data-testid="continue-button"]').click();
      await page.waitForTimeout(500);
    }
    
      // Check for checkpoint_passed event
    const events = await getCapturedEvents(page);
    const checkpointEvent = events.find(isCheckpointPassedEvent);
    
    expect(checkpointEvent).toBeDefined();
    if (checkpointEvent) {
      expect(checkpointEvent.checkpoint_id).toBeDefined();
      expect(checkpointEvent.tutorial_id).toBeDefined();
      expect(checkpointEvent.checkpoint_index).toBeDefined();
      expect(checkpointEvent.attempt_count).toBeDefined();
      expect(checkpointEvent.completion_time_ms).toBeDefined();
    }
  });

  test('should fire lesson_completed event when all steps complete', async () => {
    await page.goto('/learn/lesson/basic-circle');
    await page.waitForSelector('[data-testid="lesson-runner"]');
    
    // Complete all steps in lesson
    while (await page.locator('[data-testid="continue-button"]').isVisible()) {
      await page.locator('[data-testid="drawing-canvas"]').click();
      await page.locator('[data-testid="continue-button"]').click();
      await page.waitForTimeout(500);
    }
    
    // Wait for completion screen
    await page.waitForSelector('[data-testid="lesson-complete"]');
    
    // Check for lesson_completed event
    const events = await getCapturedEvents(page);
    const completionEvent = events.find(isLessonCompletedEvent);
    
    expect(completionEvent).toBeDefined();
    if (completionEvent) {
      expect(completionEvent.lesson_id).toBeDefined();
      expect(completionEvent.completed_steps).toBeDefined();
      expect(completionEvent.total_steps).toBeDefined();
      expect(completionEvent.total_duration_ms).toBeDefined();
      expect(completionEvent.average_score).toBeDefined();
      expect(completionEvent.stars_earned).toBeDefined();
    }
  });

  test('should fire tutorial_completed event when tutorial finishes', async () => {
    await page.goto('/learn/tutorial/portrait-basics');
    await page.waitForSelector('[data-testid="tutorial-runner"]');
    
    // Complete entire tutorial (multiple checkpoints)
    while (await page.locator('[data-testid="continue-button"]').isVisible()) {
      await page.locator('[data-testid="drawing-canvas"]').click();
      await page.locator('[data-testid="continue-button"]').click();
      await page.waitForTimeout(500);
    }
    
    // Wait for tutorial completion
    await page.waitForSelector('[data-testid="tutorial-complete"]');
    
    // Check for tutorial_completed event
    const events = await getCapturedEvents(page);
    const completionEvent = events.find(e => e.name === 'tutorial_completed');
    
    expect(completionEvent).toBeDefined();
    if (completionEvent && completionEvent.name === 'tutorial_completed') {
      expect(completionEvent.tutorial_id).toBe('portrait-basics');
    expect(completionEvent.completed_lessons).toBeGreaterThan(0);
    expect(completionEvent.average_score).toBeGreaterThanOrEqual(0);
    expect(completionEvent.total_duration_ms).toBeGreaterThan(0);
    }
  });

  test('should track hint usage in step_attempted events', async () => {
    await page.goto('/learn/lesson/basic-circle');
    await page.waitForSelector('[data-testid="lesson-runner"]');
    
    // Clear initial events
    await clearCapturedEvents(page);
    
    // Use hints before attempting
    await page.locator('[data-testid="hint-button"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="hint-button"]').click();
    await page.waitForTimeout(500);
    
    // Now attempt the step
    await page.locator('[data-testid="drawing-canvas"]').click();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    
    // Check step_attempted event includes hint usage
    const events = await getCapturedEvents(page);
    const stepEvent = events.find(isStepAttemptedEvent);
    
    expect(stepEvent).toBeDefined();
    if (stepEvent) {
      expect(stepEvent.hints_used).toBeGreaterThanOrEqual(1);
    expect(stepEvent.hints_used).toBeLessThanOrEqual(3);
    }
  });

  test('should not include raw stroke data in events', async () => {
    await page.goto('/learn/lesson/basic-circle');
    await page.waitForSelector('[data-testid="lesson-runner"]');
    
    // Clear initial events
    await clearCapturedEvents(page);
    
    // Draw complex stroke
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await canvas.click({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    
    // Draw multiple points
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(50 + i * 10, 50 + Math.sin(i) * 20);
      await page.waitForTimeout(50);
    }
    await page.mouse.up();
    
    // Get all events
    const events = await getCapturedEvents(page);
    
    // Verify no events contain raw coordinate data
    events.forEach(event => {
      expect(event).not.toHaveProperty('points');
      expect(event).not.toHaveProperty('coordinates');
      expect(event).not.toHaveProperty('path');
      expect(event).not.toHaveProperty('raw_strokes');
      // For step_attempted, it SHOULD have stroke_data
      if (isStepAttemptedEvent(event)) {
        expect(event).not.toHaveProperty('strokes'); // no raw strokes
        expect(event.stroke_data).toBeDefined();
        expect(event.stroke_data?.stroke_count).toBeDefined();
        expect(event.stroke_data?.avg_stroke_length).toBeDefined();
      } else {
        // Other events should not have stroke data at all
        expect(event).not.toHaveProperty('stroke_data');
      }
    });
  });

  test('should queue events offline and send when online', async () => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto('/learn/lesson/basic-circle');
    await page.waitForSelector('[data-testid="lesson-runner"]');
    
    // Perform actions while offline
    await page.locator('[data-testid="drawing-canvas"]').click();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    
    // Check that events are queued locally
    const queueLength = await page.evaluate(() => {
      const queue = JSON.parse(window.localStorage.getItem('lc_analytics_queue_v1') || '[]');
      return queue?.length || 0;
    });
    
    expect(queueLength).toBeGreaterThan(0);
        
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for queue to flush
    await page.waitForTimeout(2000);
    
    // Verify queue was processed
    await page.waitForFunction(() => {
      return JSON.parse(window.localStorage.getItem('lc_analytics_queue_v1') || '[]').length === 0;
    }, { timeout: 5000 });

    const newQueueLength = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('lc_analytics_queue_v1') || '[]').length;
    });
    
        // Queue should be smaller or empty after flushing
    expect(newQueueLength).toBe(0);
  });
});

// Custom assertions for analytics events
const analyticsAssertions = {
  async expectEventFired(page: Page, eventName: LearningEvent['name']) {
    const events = await getCapturedEvents(page);
    const event = events.find(e => e.name === eventName);
    expect(event).toBeDefined();
    return event;
  },

  async expectNoRawStrokeData(page: Page) {
    const events = await getCapturedEvents(page);
    events.forEach(event => {
      expect(event).not.toHaveProperty('points');
      expect(event).not.toHaveProperty('coordinates');
      expect(event).not.toHaveProperty('raw_strokes');
    });
  },

  async expectAggregateDataOnly(page: Page) {
    const events = await getCapturedEvents(page);
    const stepEvents = events.filter(isStepAttemptedEvent);
    
    stepEvents.forEach(event => {
      if (event.stroke_data && event.stroke_data.stroke_count > 0) {
        expect(event.stroke_data.avg_stroke_length).toBeGreaterThan(0);
        expect(event.stroke_data.total_draw_time_ms).toBeGreaterThan(0);
      }
    });
  }
};
