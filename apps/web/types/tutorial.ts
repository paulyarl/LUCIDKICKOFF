import { z } from 'zod';

export interface OnionSkin {
  svg: string; // inline SVG overlay string
}

export interface HintTier {
  tier: 1 | 2 | 3;
  text: string;
  action?: 'play_demo';
}

export interface TutorialRubric {
  // Keep rubric flexible per checkpoint
  target_coverage?: number; // 0..1
  max_offset_px?: number;
  min_fill_ratio?: number; // 0..1
  leak_tolerance?: number; // 0..1
  shadow_alignment?: number; // 0..1
  max_hard_edges_ratio?: number; // 0..1
}

export interface TutorialCheckpoint {
  id: string;
  order: number;
  title: string;
  graded: boolean;
  onion_skin: OnionSkin;
  hint_tiers?: HintTier[];
  rubric?: TutorialRubric; // optional if ungraded
}

export interface Tutorial {
  id: string;
  title: string;
  est_minutes: number;
  description?: string;
  checkpoints: TutorialCheckpoint[];
}

// Zod schemas
const zOnionSkin = z.object({
  svg: z.string(),
});

const zHintTier = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string(),
  action: z.literal('play_demo').optional(),
});

const zTutorialRubric = z.object({
  target_coverage: z.number().min(0).max(1).optional(),
  max_offset_px: z.number().optional(),
  min_fill_ratio: z.number().min(0).max(1).optional(),
  leak_tolerance: z.number().min(0).max(1).optional(),
  shadow_alignment: z.number().min(0).max(1).optional(),
  max_hard_edges_ratio: z.number().min(0).max(1).optional(),
});

const zTutorialCheckpoint = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  graded: z.boolean(),
  onion_skin: zOnionSkin,
  hint_tiers: z.array(zHintTier).optional(),
  rubric: zTutorialRubric.optional(),
});

export const zTutorial = z.object({
  id: z.string(),
  title: z.string(),
  est_minutes: z.number(),
  description: z.string().optional(),
  checkpoints: z.array(zTutorialCheckpoint).min(1),
});

export function validateTutorial(tutorial: unknown): Tutorial {
  try {
    return zTutorial.parse(tutorial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => {
        const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
        return `${issue.message}${path}`;
      });
      throw new Error(`Tutorial validation failed:\n- ${issues.join('\n- ')}`);
    }
    throw error;
  }
}
