import { z } from 'zod';

export type StepType = 'stroke-path' | 'area-fill' | 'dot-to-dot' | 'layer-order';

export interface StepSpec {
  id: string;
  title: string;
  type: StepType;
  constraints?: {
    tool?: 'pencil' | 'pen' | 'fill' | 'move';
    size_range?: [number, number];
    color?: string;
    locked?: boolean;
  };
  guide?: any;
  rubric?: any;
  hints?: {
    tier: 1 | 2 | 3;
    text: string;
    action?: 'play_demo';
  }[];
  on_success?: {
    award?: {
      xp?: number;
      stars?: number;
    };
    unlock?: string;
  };
}

export interface Checkpoint {
  id: string;
  order: number;
  title: string;
  stepIds: string[];
}

export interface Lesson {
  id: string;
  title: string;
  skill_tag: string;
  checkpoints: Checkpoint[];
  est_minutes: number;
  // Optional: embedded step specifications for self-contained lessons
  steps?: StepSpec[];
}

// Zod schemas
const zStepType = z.enum(['stroke-path', 'area-fill', 'dot-to-dot', 'layer-order']);

const zConstraints = z.object({
  tool: z.enum(['pencil', 'pen', 'fill', 'move']).optional(),
  size_range: z.tuple([z.number(), z.number()]).optional(),
  color: z.string().optional(),
  locked: z.boolean().optional(),
}).optional();

const zHint = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string(),
  action: z.literal('play_demo').optional(),
});

const zOnSuccess = z.object({
  award: z.object({
    xp: z.number().optional(),
    stars: z.number().optional(),
  }).optional(),
  unlock: z.string().optional(),
}).optional();

export const zStepSpec = z.object({
  id: z.string(),
  title: z.string(),
  type: zStepType,
  constraints: zConstraints,
  guide: z.any().optional(),
  rubric: z.any().optional(),
  hints: z.array(zHint).optional(),
  on_success: zOnSuccess,
});

const zCheckpoint = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  stepIds: z.array(z.string()),
});

export const zLesson = z.object({
  id: z.string(),
  title: z.string(),
  skill_tag: z.string(),
  checkpoints: z.array(zCheckpoint),
  est_minutes: z.number(),
  // Optional: allow embedded steps for self-contained lessons
  steps: z.array(zStepSpec).optional(),
});

/**
 * Validates a step specification with readable error messages
 * @param spec - Unknown input to validate as StepSpec
 * @returns Validated StepSpec
 * @throws Error with readable validation message
 */
export function validateStep(spec: unknown): StepSpec {
  try {
    return zStepSpec.parse(spec);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => {
        const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
        return `${issue.message}${path}`;
      });
      throw new Error(`Step validation failed:\n- ${issues.join('\n- ')}`);
    }
    throw error;
  }
}

/**
 * Validates a lesson with readable error messages
 * @param lesson - Unknown input to validate as Lesson
 * @returns Validated Lesson
 * @throws Error with readable validation message
 */
export function validateLesson(lesson: unknown): Lesson {
  try {
    return zLesson.parse(lesson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => {
        const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
        return `${issue.message}${path}`;
      });
      throw new Error(`Lesson validation failed:\n- ${issues.join('\n- ')}`);
    }
    throw error;
  }
}
