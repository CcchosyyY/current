import { z } from "zod";
import { SAMPLE_MAX } from "@/modules/task/service";

// 비교 API 입력 검증 (docs/plan-stage1.md S7 API 계약)

export const SettingsSchema = z
  .object({
    reasoning: z.enum(["default", "low", "high"]).default("default"),
    maxLength: z.enum(["default", "short"]).default("default"),
  })
  .default({ reasoning: "default", maxLength: "default" });

export const CreateBodySchema = z.object({
  taskId: z.uuid(),
  sample: z.string().min(1).max(SAMPLE_MAX),
  modelIds: z.array(z.string().min(1).max(200)).min(1).max(10),
  blind: z.boolean().default(true),
  settings: SettingsSchema,
});

export const ChoiceBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pick"), runId: z.uuid(), decisionMs: z.number().int().min(0).optional() }),
  z.object({ kind: z.literal("tie"), decisionMs: z.number().int().min(0).optional() }),
  z.object({ kind: z.literal("all_bad"), decisionMs: z.number().int().min(0).optional() }),
]);

export const IdSchema = z.uuid();
