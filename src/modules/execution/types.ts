// 모델 실행 모듈 타입 (docs/architecture.md §3-2 ⑦)

/** 사용자가 비교 단위로 고르는 설정 (R-27). 한 비교 안의 모든 모델에 같게 적용 */
export interface ModelSettings {
  reasoning: "default" | "low" | "high";
  maxLength: "default" | "short";
}

export const DEFAULT_SETTINGS: ModelSettings = { reasoning: "default", maxLength: "default" };

export type RunStatus = "running" | "success" | "error" | "timeout";

/** runs 한 행 (서버 안에서만 쓴다 — 화면에 보낼 땐 비교 모듈의 blind.ts를 거친다) */
export interface RunRecord {
  id: string;
  comparisonId: string | null;
  requestedModelId: string;
  displayPosition: number;
  status: RunStatus;
  outputText: string | null;
  errorCode: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  providerName: string | null;
}
