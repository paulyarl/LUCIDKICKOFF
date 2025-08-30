import { z } from 'zod';

// Base event schema
const BaseEventSchema = z.object({
  // Common properties for all events
  timestamp: z.number().optional().describe('Unix timestamp in milliseconds'),
  userId: z.string().optional().describe('User ID if available'),
  sessionId: z.string().optional().describe('Session ID'),
  deviceId: z.string().optional().describe('Device ID'),
  page: z.string().optional().describe('Current page URL path'),
  referrer: z.string().optional().describe('Referrer URL'),
  userAgent: z.string().optional().describe('User agent string'),
  screenWidth: z.number().optional().describe('Screen width in pixels'),
  screenHeight: z.number().optional().describe('Screen height in pixels'),
  viewportWidth: z.number().optional().describe('Viewport width in pixels'),
  viewportHeight: z.number().optional().describe('Viewport height in pixels'),
  // Add any other common properties here
});

// Brush stroke event
const BrushStrokeEventSchema = BaseEventSchema.extend({
  event: z.literal('brush_stroke'),
  brushType: z.string().describe('Type of brush used'),
  strokeLength: z.number().describe('Length of the stroke in pixels'),
  duration: z.number().describe('Duration of the stroke in milliseconds'),
  canvasId: z.string().describe('ID of the canvas'),
  layerId: z.string().optional().describe('ID of the layer'),
  color: z.string().optional().describe('Color used'),
  size: z.number().optional().describe('Brush size'),
  pressure: z.number().optional().describe('Pressure sensitivity if available'),
});

// Save event
const SaveEventSchema = BaseEventSchema.extend({
  event: z.literal('save'),
  canvasId: z.string().describe('ID of the canvas'),
  method: z.enum(['auto', 'manual', 'background']).describe('Save method'),
  success: z.boolean().describe('Whether the save was successful'),
  error: z.string().optional().describe('Error message if save failed'),
  duration: z.number().optional().describe('Time taken to save in milliseconds'),
  size: z.number().optional().describe('Size of the saved data in bytes'),
});

// Performance metrics
const PerformanceEventSchema = BaseEventSchema.extend({
  event: z.literal('performance_metric'),
  metricName: z.enum([
    'time_to_first_stroke',
    'canvas_load_time',
    'save_latency',
    'brush_latency_p50',
    'brush_latency_p95',
    'brush_latency_p99',
  ]),
  value: z.number().describe('Numeric value of the metric'),
  unit: z.enum(['ms', 's', 'bytes']).default('ms'),
});

// Learning Analytics Event Types
const LearningEventSchema = BaseEventSchema.extend({
  event: z.literal('learning'),
  action: z.enum(['lesson_started', 'step_attempted', 'checkpoint_passed', 'lesson_completed', 'tutorial_completed']),
  lesson_id: z.string().optional(),
  tutorial_id: z.string().optional(),
  checkpoint_id: z.string().optional(),
  step_id: z.string().optional(),
  step_type: z.enum(['stroke-path', 'area-fill', 'dot-to-dot', 'layer-order']).optional(),
  result: z.enum(['pass', 'fail', 'skipped']).optional(),
  score: z.number().min(0).max(1).optional(), // normalized 0-1
  stars_earned: z.number().min(0).max(3).optional(),
  attempt_duration_ms: z.number().optional(),
  hint_tier_reached: z.number().min(1).max(3).optional(),
  total_attempts: z.number().optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
  // Aggregated stroke data only - no raw coordinates
  stroke_count: z.number().optional(),
  avg_stroke_length: z.number().optional(),
  total_draw_time_ms: z.number().optional(),
});

// User interaction events
const InteractionEventSchema = BaseEventSchema.extend({
  event: z.literal('interaction'),
  element: z.string().describe('ID or class of the interacted element'),
  action: z.string().describe('Type of interaction (click, hover, etc.)'),
  value: z.any().optional().describe('Value associated with the interaction'),
});

// Error events
const ErrorEventSchema = BaseEventSchema.extend({
  event: z.literal('error'),
  errorType: z.string().describe('Type of error'),
  errorMessage: z.string().describe('Error message'),
  stackTrace: z.string().optional().describe('Stack trace if available'),
  componentStack: z.string().optional().describe('React component stack if available'),
  context: z.record(z.string(), z.any()).optional().describe('Additional context about the error'),
});

// Session events
const SessionEventSchema = BaseEventSchema.extend({
  event: z.literal('session'),
  type: z.enum(['start', 'end', 'extend']),
  duration: z.number().optional().describe('Session duration in milliseconds'),
  reason: z.string().optional().describe('Reason for session end'),
});

// Combine all event schemas
const EventSchema = z.discriminatedUnion('event', [
  BrushStrokeEventSchema,
  SaveEventSchema,
  PerformanceEventSchema,
  LearningEventSchema,
  InteractionEventSchema,
  ErrorEventSchema,
  SessionEventSchema,
]);

// Type for TypeScript usage
type AnalyticsEvent = z.infer<typeof EventSchema>;

// Helper to validate and clean events before sending
export function validateEvent(event: AnalyticsEvent): AnalyticsEvent {
  return EventSchema.parse(event);
}

// Export type guards for runtime checks
export const isBrushStrokeEvent = (event: unknown): event is z.infer<typeof BrushStrokeEventSchema> =>
  BrushStrokeEventSchema.safeParse(event).success;

export const isSaveEvent = (event: unknown): event is z.infer<typeof SaveEventSchema> =>
  SaveEventSchema.safeParse(event).success;

export const isPerformanceEvent = (event: unknown): event is z.infer<typeof PerformanceEventSchema> =>
  PerformanceEventSchema.safeParse(event).success;

export const isInteractionEvent = (event: unknown): event is z.infer<typeof InteractionEventSchema> =>
  InteractionEventSchema.safeParse(event).success;

export const isErrorEvent = (event: unknown): event is z.infer<typeof ErrorEventSchema> =>
  ErrorEventSchema.safeParse(event).success;

export const isSessionEvent = (event: unknown): event is z.infer<typeof SessionEventSchema> =>
  SessionEventSchema.safeParse(event).success;

export const isLearningEvent = (event: unknown): event is z.infer<typeof LearningEventSchema> =>
  LearningEventSchema.safeParse(event).success;

// Export types
export type LearningEvent = z.infer<typeof LearningEventSchema>;
export type { AnalyticsEvent };

// Export schema for CI validation
export const AnalyticsEventSchema = EventSchema;
