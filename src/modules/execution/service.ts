import "server-only";
import { ApiError } from "@/lib/api-error";
import { buildSentParams, chat, type ChatParams, type ChatResult } from "@/lib/openrouter";
import type { CatalogModel } from "@/modules/catalog/types";
import {
  completeRun,
  insertRuns,
  listRunsOf,
  serverCostSince,
  type NewRun,
} from "./repository";
import type { ModelSettings, RunRecord } from "./types";

/**
 * 모델 실행 모듈 (docs/architecture.md §3-2 ⑦, plan-stage1 S6).
 * 모델 1개 × 샘플 1개를 돌리고 runs에 남긴다. 블라인드·선택·순위는 모른다.
 */

export { RunsAlreadyStarted } from "./repository";
export { serverCostSince, listRunsOf };

/** 서버 키 실행의 안전 상한 — 사용자에겐 안 보인다 (plan-stage1 §2-2) */
export const SERVER_MAX_TOKENS = 4096;
/** "짧게"를 고르면 */
export const SHORT_MAX_TOKENS = 1024;

/** 사용자 설정(R-27) → OpenRouter 파라미터. 기본값이면 아무것도 안 보낸다 (+ 서버 키 안전 상한) */
export function toChatParams(settings: ModelSettings, keyKind: "server" | "user"): ChatParams {
  const params: ChatParams = {};
  if (settings.reasoning !== "default") params.reasoningEffort = settings.reasoning;
  if (settings.maxLength === "short") params.maxTokens = SHORT_MAX_TOKENS;
  if (keyKind === "server") {
    params.maxTokens = Math.min(params.maxTokens ?? SERVER_MAX_TOKENS, SERVER_MAX_TOKENS);
  }
  return params;
}

/** 서버 키로 이 모델·설정을 돌려도 되나 (R-25, R-26). 안 되면 ApiError */
export function assertServerRunnable(model: CatalogModel & { isActive: boolean }, settings: ModelSettings) {
  if (!model.serverAllowed || !model.isActive) {
    throw new ApiError("model_not_allowed", 400, `${model.name}은(는) 개인 키가 필요해요 (준비 중)`);
  }
  if (settings.reasoning === "high") {
    throw new ApiError("setting_not_allowed", 400, "추론 '높음'은 개인 키가 필요해요 (준비 중)");
  }
}

export interface PlannedRun {
  model: CatalogModel & { isActive: boolean };
  position: number;
}

/**
 * 비교의 실행들을 시작해서 끝까지 돌린다.
 * 1) 위치마다 runs 행을 먼저 넣는다 — 같은 비교를 두 번 돌리면 여기서 RunsAlreadyStarted
 * 2) 모델들을 병렬로 호출하고 각 행을 한 번씩 완료한다. 하나가 실패해도 나머지는 계속.
 */
export async function executeComparisonRuns(input: {
  comparisonId: string;
  userId: string;
  taskTypeId: string;
  sampleId: string;
  prompt: string;
  settings: ModelSettings;
  plan: PlannedRun[];
}): Promise<RunRecord[]> {
  const keyKind = "server" as const; // 1단계는 서버 키만 (개인 키는 3단계)
  const params = toChatParams(input.settings, keyKind);
  for (const p of input.plan) assertServerRunnable(p.model, input.settings);

  const rows: NewRun[] = input.plan.map((p) => ({
    comparison_id: input.comparisonId,
    user_id: input.userId,
    task_type_id: input.taskTypeId,
    sample_id: input.sampleId,
    requested_model_id: p.model.id,
    model_canonical_slug: p.model.canonicalSlug, // 응답 model엔 버전이 없다 (R-12)
    display_position: p.position,
    key_kind: keyKind,
    params: buildSentParams(params),
  }));
  const started = await insertRuns(rows);

  const byModel = new Map(input.plan.map((p) => [p.model.id, p.model]));
  return Promise.all(
    started.map(async (run) => {
      const model = byModel.get(run.requestedModelId)!;
      let result: ChatResult;
      try {
        result = await chat({ model: model.id, prompt: input.prompt, params });
      } catch (err) {
        // chat()은 실패를 값으로 돌려주지만, 혹시 던져도 행이 "running"으로 남지 않게
        result = {
          ok: false,
          code: "unknown",
          message: err instanceof Error ? err.message : String(err),
          latencyMs: 0,
          sentParams: buildSentParams(params),
          costUsd: null,
          inputTokens: null,
          outputTokens: null,
          reasoningTokens: null,
          responseModel: null,
          provider: null,
          generationId: null,
        };
      }
      return completeRun(run.id, toCompletion(result, model));
    }),
  );
}

function estimateCost(r: ChatResult, model: CatalogModel): number | null {
  if (r.inputTokens === null && r.outputTokens === null) return null;
  return (r.inputTokens ?? 0) * model.promptPrice + (r.outputTokens ?? 0) * model.completionPrice;
}

function toCompletion(r: ChatResult, model: CatalogModel) {
  // 실패해도 청구됐을 수 있다 (빈 답 등) → 비용은 성공·실패 모두 기록
  const cost = r.costUsd ?? estimateCost(r, model);
  return {
    status: r.ok ? ("success" as const) : r.code === "timeout" ? ("timeout" as const) : ("error" as const),
    response_model: r.responseModel,
    provider_name: r.provider,
    system_fingerprint: r.ok ? r.systemFingerprint : null,
    output_text: r.ok ? r.text : null,
    error_code: r.ok ? null : r.code,
    input_tokens: r.inputTokens,
    output_tokens: r.outputTokens,
    reasoning_tokens: r.reasoningTokens,
    cost_usd: cost,
    cost_source: r.costUsd !== null ? ("openrouter" as const) : cost !== null ? ("estimated" as const) : null,
    latency_ms: r.latencyMs,
    openrouter_generation_id: r.generationId,
  };
}
