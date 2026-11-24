import { z } from "zod";

/** Sprint 1.1 — shared step contracts. Renderers and editors import from here. */

export const STEP_TYPES = [
  "slide",
  "match-pairs",
  "knowledge-check",
  "reward",
  "stroke-path",
  "area-fill",
  "dot-to-dot",
  "layer-order",
] as const;

export type StepType = (typeof STEP_TYPES)[number];

export function isStepType(value: unknown): value is StepType {
  return typeof value === "string" && (STEP_TYPES as readonly string[]).includes(value);
}

const zHint = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string().min(1),
  action: z.literal("play_demo").optional(),
});

const zBase = {
  id: z.string().min(1),
  title: z.string().min(1),
  hints: z.array(zHint).optional(),
  on_success: z
    .object({
      award: z
        .object({ xp: z.number().optional(), stars: z.number().optional() })
        .optional(),
      unlock: z.string().optional(),
    })
    .optional(),
};

const zPoint = z.object({ x: z.number(), y: z.number() });

export const zSlideStep = z.object({
  ...zBase,
  type: z.literal("slide"),
  guide: z.object({
    image: z.string().optional(),
    text: z.string().min(1),
    narration: z.string().optional(),
    tapTarget: z
      .object({
        prompt: z.string().min(1),
        x: z.number(),
        y: z.number(),
        radius: z.number().positive().optional(),
      })
      .optional(),
  }),
});

const zPairItem = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  image: z.string().optional(),
});

export const zMatchPairsStep = z.object({
  ...zBase,
  type: z.literal("match-pairs"),
  guide: z
    .object({
      items: z.array(zPairItem).min(2),
      targets: z.array(zPairItem).min(2),
      answers: z.record(z.string(), z.string()),
    })
    .refine(
      (guide) =>
        guide.items.every(
          (item) =>
            guide.answers[item.id] &&
            guide.targets.some((target) => target.id === guide.answers[item.id]),
        ),
      { message: "every item must map to a known target" },
    ),
  rubric: z.object({ threshold: z.number().min(0).max(1).default(1) }).optional(),
});

const zOption = z.object({
  label: z.string().min(1),
  correct: z.boolean(),
});

const zQuestion = z
  .object({
    prompt: z.string().min(1),
    image: z.string().optional(),
    options: z.array(zOption).min(2),
  })
  .refine((q) => q.options.filter((o) => o.correct).length === 1, {
    message: "each question needs exactly one correct option",
  });

export const zKnowledgeCheckStep = z.object({
  ...zBase,
  type: z.literal("knowledge-check"),
  guide: z.object({
    passage: z
      .object({
        title: z.string().optional(),
        body: z.string().min(1),
        image: z.string().optional(),
      })
      .optional(),
    questions: z.array(zQuestion).min(1),
  }),
  rubric: z.object({ threshold: z.number().min(0).max(1).default(0.6) }).optional(),
});

export const zRewardStep = z.object({
  ...zBase,
  type: z.literal("reward"),
  guide: z.object({
    items: z.array(z.string().min(1)).min(1),
    badge: z.string().optional(),
  }),
});

export const zStrokePathStep = z.object({
  ...zBase,
  type: z.literal("stroke-path"),
  guide: z.object({
    path: z.array(zPoint).min(2),
    overlay: z.string().optional(),
    tip: z.string().optional(),
  }),
  constraints: z
    .object({
      tool: z.enum(["pencil", "pen", "fill", "move"]).optional(),
      size_range: z.tuple([z.number(), z.number()]).optional(),
      color: z.string().optional(),
      locked: z.boolean().optional(),
    })
    .optional(),
  rubric: z
    .object({
      threshold: z.number().min(0).max(1).default(0.65),
      tolerancePx: z.number().positive().optional(),
    })
    .optional(),
});

export const zAreaFillStep = z.object({
  ...zBase,
  type: z.literal("area-fill"),
  guide: z.object({
    mask: z.string().optional(),
    targetColor: z.string().min(1),
    templateId: z.string().optional(),
  }),
  rubric: z
    .object({
      threshold: z.number().min(0).max(1).default(0.8),
      coverageThreshold: z.number().min(0).max(1).default(0.85),
    })
    .optional(),
});

export const zDotToDotStep = z.object({
  ...zBase,
  type: z.literal("dot-to-dot"),
  guide: z.object({
    targets: z.array(zPoint).min(2),
    labels: z.array(z.string()).optional(),
  }),
  rubric: z
    .object({ threshold: z.number().min(0).max(1).default(1), tolerancePx: z.number().positive().default(12) })
    .optional(),
});

export const zLayerOrderStep = z.object({
  ...zBase,
  type: z.literal("layer-order"),
  guide: z.object({
    targetOrder: z.array(z.string().min(1)).min(2),
    items: z.array(z.string().min(1)).optional(),
  }),
});

export const zAnyStep = z.discriminatedUnion("type", [
  zSlideStep,
  zMatchPairsStep,
  zKnowledgeCheckStep,
  zRewardStep,
  zStrokePathStep,
  zAreaFillStep,
  zDotToDotStep,
  zLayerOrderStep,
]);

export type StepSpec = z.infer<typeof zAnyStep>;

type StepDefinition = {
  schema: z.ZodTypeAny;
  defaults: () => StepSpec;
  summarize: (step: StepSpec) => string;
};

export const stepRegistry: Record<StepType, StepDefinition> = {
  slide: {
    schema: zSlideStep,
    defaults: () => ({
      id: `slide_${Date.now()}`,
      type: "slide",
      title: "New slide",
      guide: { text: "Write the slide text here." },
      hints: [{ tier: 1, text: "Look at the picture and listen." }],
    }),
    summarize: (s) => ("guide" in s && "text" in s.guide ? s.guide.text.slice(0, 48) : s.title),
  },
  "match-pairs": {
    schema: zMatchPairsStep,
    defaults: () => ({
      id: `match_${Date.now()}`,
      type: "match-pairs",
      title: "Match the pairs",
      guide: {
        items: [
          { id: "a", label: "Item A" },
          { id: "b", label: "Item B" },
        ],
        targets: [
          { id: "x", label: "Target X" },
          { id: "y", label: "Target Y" },
        ],
        answers: { a: "x", b: "y" },
      },
      hints: [{ tier: 1, text: "Drag each item to its home." }],
    }),
    summarize: (s) =>
      "guide" in s && Array.isArray((s.guide as any).items)
        ? `${(s.guide as any).items.length} pairs`
        : s.title,
  },
  "knowledge-check": {
    schema: zKnowledgeCheckStep,
    defaults: () => ({
      id: `check_${Date.now()}`,
      type: "knowledge-check",
      title: "Quick check",
      guide: {
        questions: [
          {
            prompt: "What did you learn?",
            options: [
              { label: "This", correct: true },
              { label: "That", correct: false },
            ],
          },
        ],
      },
      hints: [{ tier: 1, text: "Think back to the story." }],
    }),
    summarize: (s) =>
      "guide" in s && "questions" in s.guide ? `${s.guide.questions.length} questions` : s.title,
  },
  reward: {
    schema: zRewardStep,
    defaults: () => ({
      id: `reward_${Date.now()}`,
      type: "reward",
      title: "Lesson complete",
      guide: { items: ["Completed the lesson"] },
    }),
    summarize: (s) =>
      "guide" in s && Array.isArray((s.guide as any).items)
        ? `${(s.guide as any).items.length} items`
        : s.title,
  },
  "stroke-path": {
    schema: zStrokePathStep,
    defaults: () => ({
      id: `stroke_${Date.now()}`,
      type: "stroke-path",
      title: "Trace the path",
      guide: { path: [{ x: 120, y: 300 }, { x: 480, y: 180 }] },
      hints: [{ tier: 1, text: "Follow the line slowly." }],
    }),
    summarize: (s) => ("guide" in s && "path" in s.guide ? `${s.guide.path.length} points` : s.title),
  },
  "area-fill": {
    schema: zAreaFillStep,
    defaults: () => ({
      id: `fill_${Date.now()}`,
      type: "area-fill",
      title: "Color the area",
      guide: { targetColor: "#D9A441" },
      hints: [{ tier: 1, text: "Fill inside the lines." }],
    }),
    summarize: (s) => ("guide" in s && "targetColor" in s.guide ? s.guide.targetColor : s.title),
  },
  "dot-to-dot": {
    schema: zDotToDotStep,
    defaults: () => ({
      id: `dots_${Date.now()}`,
      type: "dot-to-dot",
      title: "Connect the dots",
      guide: { targets: [{ x: 100, y: 100 }, { x: 300, y: 200 }] },
    }),
    summarize: (s) =>
      "guide" in s && "targets" in s.guide ? `${s.guide.targets.length} dots` : s.title,
  },
  "layer-order": {
    schema: zLayerOrderStep,
    defaults: () => ({
      id: `layers_${Date.now()}`,
      type: "layer-order",
      title: "Order the layers",
      guide: { targetOrder: ["background", "foreground"] },
    }),
    summarize: (s) =>
      "guide" in s && "targetOrder" in s.guide ? `${s.guide.targetOrder.length} layers` : s.title,
  },
};

export function parseStep(data: unknown): StepSpec {
  try {
    return zAnyStep.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".") || "step"}: ${issue.message}`);
      throw new Error(`Invalid step:\n- ${issues.join("\n- ")}`);
    }
    throw error;
  }
}

export function parseStepOfType(type: StepType, data: unknown): StepSpec {
  const definition = stepRegistry[type];
  if (!definition) throw new Error(`Unknown step type: ${type}`);
  try {
    return definition.schema.parse(data) as StepSpec;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".") || type}: ${issue.message}`);
      throw new Error(`Invalid ${type} step:\n- ${issues.join("\n- ")}`);
    }
    throw error;
  }
}

export function createStep(type: StepType): StepSpec {
  return stepRegistry[type].defaults();
}
