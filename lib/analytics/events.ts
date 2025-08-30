import { z } from 'zod';

// Base event schema with common fields
export const BaseEventSchema = z.object({
  // Unique event ID
  id: z.string().uuid(),
  // Event name/type (e.g., 'lesson_started', 'step_attempted')
  name: z.string().min(1),
  // When the event occurred (ISO 8601 timestamp)
  timestamp: z.string().datetime(),
  // Session ID to group related events
  session_id: z.string().uuid(),
  // User ID (if authenticated)
  user_id: z.string().uuid().optional(),
  // Version of the event schema
  schema_version: z.literal('1.0.0'),
});

// Schema for stroke data (aggregated only, no raw coordinates)
export const StrokeAggregatesSchema = z.object({
  // Number of strokes
  stroke_count: z.number().int().nonnegative(),
  // Average stroke length in pixels
  avg_stroke_length: z.number().nonnegative(),
  // Total drawing time in milliseconds
  total_draw_time_ms: z.number().nonnegative(),
});

// Schema for learning events
export const LearningEventSchema = BaseEventSchema.and(z.discriminatedUnion('name', [
  // Lesson started event
  z.object({
    name: z.literal('lesson_started'),
    lesson_id: z.string().min(1),
    lesson_title: z.string().min(1),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  }),
  
  // Step attempted event
  z.object({
    name: z.literal('step_attempted'),
    lesson_id: z.string().min(1),
    step_id: z.string().min(1),
    step_index: z.number().int().nonnegative(),
    is_correct: z.boolean(),
    score: z.number().min(0).max(1),
    stars: z.number().int().min(0).max(3),
    hints_used: z.number().int().nonnegative(),
    attempt_duration_ms: z.number().nonnegative(),
    stroke_data: StrokeAggregatesSchema.optional(),
  }),
  
  // Checkpoint passed event (for tutorials)
  z.object({
    name: z.literal('checkpoint_passed'),
    tutorial_id: z.string().min(1),
    checkpoint_id: z.string().min(1),
    checkpoint_index: z.number().int().nonnegative(),
    attempt_count: z.number().int().positive(),
    completion_time_ms: z.number().nonnegative(),
  }),
  
  // Lesson completed event
  z.object({
    name: z.literal('lesson_completed'),
    lesson_id: z.string().min(1),
    total_steps: z.number().int().positive(),
    completed_steps: z.number().int().nonnegative(),
    total_duration_ms: z.number().nonnegative(),
    average_score: z.number().min(0).max(1),
    stars_earned: z.number().int().min(0).max(3),
  }),
  
  // Tutorial completed event
  z.object({
    name: z.literal('tutorial_completed'),
    tutorial_id: z.string().min(1),
    total_lessons: z.number().int().positive(),
    completed_lessons: z.number().int().nonnegative(),
    total_duration_ms: z.number().nonnegative(),
    average_score: z.number().min(0).max(1),
  }),

  // Pack carousel fully browsed (UX navigation completion)
  z.object({
    name: z.literal('pack_carousel_completed'),
    pack_id: z.string().min(1),
    pack_slug: z.string().min(1),
    total_items: z.number().int().positive(),
    duration_ms: z.number().nonnegative(),
  }),

  // Template events
  z.object({
    name: z.literal('template_opened'),
    template_id: z.string().min(1),
    template_title: z.string().min(1),
    is_free: z.boolean().optional(),
  }),
  z.object({
    name: z.literal('template_colored'),
    template_id: z.string().min(1),
    action: z.enum(['fill', 'stroke']).default('stroke'),
    color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
  }),
  z.object({
    name: z.literal('template_saved'),
    template_id: z.string().min(1).nullable(),
    has_png: z.boolean().default(true),
  }),

  // UI actions
  z.object({
    name: z.literal('recent_colors_cleared'),
  }),
]));

// Type exports
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type StrokeAggregates = z.infer<typeof StrokeAggregatesSchema>;
export type LearningEvent = z.infer<typeof LearningEventSchema>;

// Helper to validate events
export function isValidLearningEvent(event: unknown): event is LearningEvent {
  return LearningEventSchema.safeParse(event).success;
}

// Helper to create a new event with common fields
export function createBaseEvent<TName extends LearningEvent['name']>(
  name: TName,
  sessionId: string,
  userId?: string,
): BaseEvent & { name: TName } {
  return {
    id: crypto.randomUUID(),
    name,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    user_id: userId,
    schema_version: '1.0.0',
  } as BaseEvent & { name: TName };
}

// Type guard for the event queue
export function isLearningEventArray(events: unknown): events is LearningEvent[] {
  return Array.isArray(events) && events.every(isValidLearningEvent);
}
