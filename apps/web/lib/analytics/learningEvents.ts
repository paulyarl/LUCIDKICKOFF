// Learning Analytics Event Helpers
import { LearningEvent } from './events';
import { analyticsQueue } from './queue';

// Session and user context
let sessionId = crypto.randomUUID();
let userId: string | undefined;

export function setAnalyticsUserId(id: string | undefined) {
  userId = id;
}

export function getSessionId() {
  return sessionId;
}

// Base event creator with common properties
function createBaseEvent(): Omit<LearningEvent, 'action'> {
  return {
    event: 'learning',
    timestamp: Date.now(),
    sessionId,
    userId,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    screenWidth: typeof window !== 'undefined' ? window.screen.width : undefined,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : undefined,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
  };
}

// Lesson Started Event
export function trackLessonStarted(params: {
  lesson_id: string;
  tutorial_id?: string;
}) {
  const event: LearningEvent = {
    ...createBaseEvent(),
    action: 'lesson_started',
    lesson_id: params.lesson_id,
    tutorial_id: params.tutorial_id,
  };
  
  analyticsQueue.enqueue(event);
}

// Step Attempted Event
export function trackStepAttempted(params: {
  step_id: string;
  lesson_id?: string;
  tutorial_id?: string;
  checkpoint_id?: string;
  step_type: 'stroke-path' | 'area-fill' | 'dot-to-dot' | 'layer-order';
  result: 'pass' | 'fail' | 'skipped';
  score?: number; // 0-1
  stars_earned?: number; // 0-3
  attempt_duration_ms?: number;
  hint_tier_reached?: number; // 1-3
  total_attempts?: number;
  // Aggregated stroke data only - no raw coordinates
  stroke_count?: number;
  avg_stroke_length?: number;
  total_draw_time_ms?: number;
}) {
  const event: LearningEvent = {
    ...createBaseEvent(),
    action: 'step_attempted',
    step_id: params.step_id,
    lesson_id: params.lesson_id,
    tutorial_id: params.tutorial_id,
    checkpoint_id: params.checkpoint_id,
    step_type: params.step_type,
    result: params.result,
    score: params.score,
    stars_earned: params.stars_earned,
    attempt_duration_ms: params.attempt_duration_ms,
    hint_tier_reached: params.hint_tier_reached,
    total_attempts: params.total_attempts,
    stroke_count: params.stroke_count,
    avg_stroke_length: params.avg_stroke_length,
    total_draw_time_ms: params.total_draw_time_ms,
  };
  
  analyticsQueue.enqueue(event);
}

// Checkpoint Passed Event
export function trackCheckpointPassed(params: {
  checkpoint_id: string;
  tutorial_id: string;
  completion_percentage: number; // 0-100
  stars_earned?: number;
  total_attempts?: number;
}) {
  const event: LearningEvent = {
    ...createBaseEvent(),
    action: 'checkpoint_passed',
    checkpoint_id: params.checkpoint_id,
    tutorial_id: params.tutorial_id,
    completion_percentage: params.completion_percentage,
    stars_earned: params.stars_earned,
    total_attempts: params.total_attempts,
  };
  
  analyticsQueue.enqueue(event);
}

// Lesson Completed Event
export function trackLessonCompleted(params: {
  lesson_id: string;
  tutorial_id?: string;
  completion_percentage: number; // should be 100
  stars_earned: number;
  total_attempts: number;
  total_draw_time_ms?: number;
}) {
  const event: LearningEvent = {
    ...createBaseEvent(),
    action: 'lesson_completed',
    lesson_id: params.lesson_id,
    tutorial_id: params.tutorial_id,
    completion_percentage: params.completion_percentage,
    stars_earned: params.stars_earned,
    total_attempts: params.total_attempts,
    total_draw_time_ms: params.total_draw_time_ms,
  };
  
  analyticsQueue.enqueue(event);
}

// Tutorial Completed Event
export function trackTutorialCompleted(params: {
  tutorial_id: string;
  completion_percentage: number; // should be 100
  stars_earned: number;
  total_attempts: number;
  total_draw_time_ms?: number;
}) {
  const event: LearningEvent = {
    ...createBaseEvent(),
    action: 'tutorial_completed',
    tutorial_id: params.tutorial_id,
    completion_percentage: params.completion_percentage,
    stars_earned: params.stars_earned,
    total_attempts: params.total_attempts,
    total_draw_time_ms: params.total_draw_time_ms,
  };
  
  analyticsQueue.enqueue(event);
}

// Helper to calculate aggregate stroke metrics from raw stroke data
export function calculateStrokeAggregates(strokes: Array<{ points: Array<{ x: number; y: number }> }>) {
  if (!strokes.length) return {};
  
  const strokeLengths = strokes.map(stroke => {
    let length = 0;
    for (let i = 1; i < stroke.points.length; i++) {
      const dx = stroke.points[i].x - stroke.points[i - 1].x;
      const dy = stroke.points[i].y - stroke.points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  });
  
  return {
    stroke_count: strokes.length,
    avg_stroke_length: strokeLengths.reduce((sum, len) => sum + len, 0) / strokeLengths.length,
  };
}
