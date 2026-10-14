// 비교 모듈 — 화면으로 나가는 모양 (docs/plan-stage1.md S7 API 계약)
// 이 타입의 값은 반드시 blind.ts의 toView()로만 만든다 (R-8).

import type { ModelSettings } from "@/modules/execution/types";

export type ComparisonStatus = "running" | "awaiting_choice" | "chosen" | "failed" | "abandoned";
export type ChoiceKind = "pick" | "tie" | "all_bad";

export interface SlotModel {
  id: string;
  name: string;
  brand: string | null; // ai_models.slug → 로고·브랜드색
}

/** 비교 화면의 칸 하나 (A, B, C …) */
export interface SlotView {
  position: number; // 0=A
  runId: string | null; // 실행 전이면 null
  status: "pending" | "running" | "success" | "error" | "timeout";
  output: string | null;
  errorCode: string | null;
  latencyMs: number | null; // 블라인드여도 보인다 (사용자 결정)
  // ↓ 블라인드 비교에서 선택 전에는 객체에 아예 없다 (R-8)
  model?: SlotModel;
  costUsd?: number | null;
}

export interface ComparisonView {
  id: string;
  status: ComparisonStatus;
  isBlind: boolean;
  revealed: boolean; // 모델 이름·비용이 공개됐나
  settings: ModelSettings;
  task: { id: string; name: string; typeName: string };
  sample: string;
  createdAt: string;
  slots: SlotView[];
  choice: { kind: ChoiceKind; runId: string | null } | null;
}

export interface CreateComparisonInput {
  taskId: string;
  sample: string;
  modelIds: string[];
  blind: boolean;
  settings: ModelSettings;
}
