import { v4 as uuidv4 } from 'uuid';
import { getAnalyticsQueue } from './queue';
import { LearningEvent, StrokeAggregates, createBaseEvent } from './events';

type Point = { x: number; y: number };
type Stroke = Point[];

// Initialize the analytics queue with environment variable
const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';
const analyticsQueue = getAnalyticsQueue(ANALYTICS_ENDPOINT);

// Session ID for grouping related events
const SESSION_ID = typeof sessionStorage !== 'undefined' 
  ? (sessionStorage.getItem('analytics_session_id') || uuidv4()) 
  : uuidv4();

// Store the session ID if in browser
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.setItem('analytics_session_id', SESSION_ID);
}

// Get user ID from auth context or local storage
function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // Try to get from auth context if available
  if ((window as any).__AUTH_CONTEXT__?.user?.id) {
    return (window as any).__AUTH_CONTEXT__.user.id;
  }
  
  // Fall back to local storage
  return localStorage.getItem('user_id') || undefined;
}

// Calculate stroke aggregates from raw stroke data
function calculateStrokeAggregates(strokes: Stroke[]): StrokeAggregates {
  if (strokes.length === 0) {
    return {
      stroke_count: 0,
      avg_stroke_length: 0,
      total_draw_time_ms: 0,
    };
  }

  let totalLength = 0;
  let totalDrawTime = 0;
  
  strokes.forEach(stroke => {
    // Calculate stroke length
    let length = 0;
    for (let i = 1; i < stroke.length; i++) {
      const dx = stroke[i].x - stroke[i - 1].x;
      const dy = stroke[i].y - stroke[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    totalLength += length;
    
    // Estimate draw time (100ms per stroke as a simple approximation)
    // In a real app, you'd track actual timestamps
    totalDrawTime += 100;
  });

  return {
    stroke_count: strokes.length,
    avg_stroke_length: totalLength / strokes.length,
    total_draw_time_ms: totalDrawTime,
  };
}

// Track when a lesson starts
export async function trackLessonStarted(params: {
  lessonId: string;
  lessonTitle: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('lesson_started', SESSION_ID, getUserId()),
    lesson_id: params.lessonId,
    lesson_title: params.lessonTitle,
    difficulty: params.difficulty,
  };

  return analyticsQueue.enqueue(event);
}

// Track when a step is attempted
export async function trackStepAttempted(params: {
  lessonId: string;
  stepId: string;
  stepIndex: number;
  isCorrect: boolean;
  score: number; // 0-1
  stars: number; // 0-3
  hintsUsed: number;
  attemptDurationMs: number;
  strokes?: Stroke[];
}): Promise<boolean> {
  const strokeData = params.strokes ? calculateStrokeAggregates(params.strokes) : undefined;
  
  const event: LearningEvent = {
    ...createBaseEvent('step_attempted', SESSION_ID, getUserId()),
    lesson_id: params.lessonId,
    step_id: params.stepId,
    step_index: params.stepIndex,
    is_correct: params.isCorrect,
    score: Math.max(0, Math.min(1, params.score)), // Clamp 0-1
    stars: Math.max(0, Math.min(3, Math.round(params.stars))), // Clamp 0-3 and round
    hints_used: Math.max(0, params.hintsUsed),
    attempt_duration_ms: Math.max(0, params.attemptDurationMs),
    stroke_data: strokeData,
  };

  return analyticsQueue.enqueue(event);
}

// Track when a checkpoint is passed in a tutorial
export async function trackCheckpointPassed(params: {
  tutorialId: string;
  checkpointId: string;
  checkpointIndex: number;
  attemptCount: number;
  completionTimeMs: number;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('checkpoint_passed', SESSION_ID, getUserId()),
    tutorial_id: params.tutorialId,
    checkpoint_id: params.checkpointId,
    checkpoint_index: params.checkpointIndex,
    attempt_count: Math.max(1, params.attemptCount),
    completion_time_ms: Math.max(0, params.completionTimeMs),
  };

  return analyticsQueue.enqueue(event);
}

// Track when a lesson is completed
export async function trackLessonCompleted(params: {
  lessonId: string;
  totalSteps: number;
  completedSteps: number;
  totalDurationMs: number;
  averageScore: number;
  starsEarned: number;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('lesson_completed', SESSION_ID, getUserId()),
    lesson_id: params.lessonId,
    total_steps: Math.max(1, params.totalSteps),
    completed_steps: Math.max(0, Math.min(params.completedSteps, params.totalSteps)),
    total_duration_ms: Math.max(0, params.totalDurationMs),
    average_score: Math.max(0, Math.min(1, params.averageScore)),
    stars_earned: Math.max(0, Math.min(3, Math.round(params.starsEarned))),
  };

  return analyticsQueue.enqueue(event);
}

// Track when a tutorial is completed
export async function trackTutorialCompleted(params: {
  tutorialId: string;
  totalLessons: number;
  completedLessons: number;
  totalDurationMs: number;
  averageScore: number;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('tutorial_completed', SESSION_ID, getUserId()),
    tutorial_id: params.tutorialId,
    total_lessons: Math.max(1, params.totalLessons),
    completed_lessons: Math.max(0, Math.min(params.completedLessons, params.totalLessons)),
    total_duration_ms: Math.max(0, params.totalDurationMs),
    average_score: Math.max(0, Math.min(1, params.averageScore)),
  };

  return analyticsQueue.enqueue(event);
}

// Force flush the queue (useful for testing or before page unload)
export async function flushAnalyticsQueue(): Promise<boolean> {
  return analyticsQueue.flush();
}

// For testing purposes
export function __resetAnalyticsQueue() {
  if (process.env.NODE_ENV === 'test') {
    analyticsQueue.clear();
  }
}

// Export the queue for direct access if needed
export { analyticsQueue };

// Track when a user navigates all items in a pack's carousel
export async function trackPackCarouselCompleted(params: {
  packId: string;
  packSlug: string;
  totalItems: number;
  durationMs: number;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('pack_carousel_completed', SESSION_ID, getUserId()),
    pack_id: params.packId,
    pack_slug: params.packSlug,
    total_items: Math.max(1, params.totalItems),
    duration_ms: Math.max(0, params.durationMs),
  } as any;

  return analyticsQueue.enqueue(event);
}
