import "server-only";
import { randomInt } from "node:crypto";
import { ApiError } from "@/lib/api-error";
import { getModels } from "@/modules/catalog/service";
import type { CatalogModel } from "@/modules/catalog/types";
import {
  assertServerRunnable,
  executeComparisonRuns,
  listRunsOf,
  RunsAlreadyStarted,
} from "@/modules/execution/service";
import { getMyTask, saveSample } from "@/modules/task/service";
import { toView } from "./blind";
import { assertCanCreate, MAX_MODELS, MIN_MODELS } from "./limits";
import {
  ChoiceAlreadyMade,
  findChoice,
  findComparison,
  findSampleContent,
  insertChoice,
  insertComparison,
  transition,
  type ComparisonRow,
} from "./repository";
import type { ChoiceKind, ComparisonView, CreateComparisonInput } from "./types";

/**
 * 비교 모듈 (docs/architecture.md §3-2 ⑥, 이야기 3, UML-4·UML-7).
 * 비교 만들기 → 실행 → 선택 → 공개. 화면으로 나가는 값은 전부 toView()를 거친다 (R-8).
 */

/** 선택을 안 하고 이만큼 지나면 방치(abandoned)로 본다 — 크론 없이 조회할 때 처리 */
const ABANDON_AFTER_MS = 24 * 60 * 60 * 1000;

function shuffle<T>(items: T[]): T[] {
  // Fisher–Yates, 암호학적 난수 (R-9 위치 편향 방지)
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadOwned(userId: string, id: string): Promise<ComparisonRow> {
  const c = await findComparison(id);
  // 남의 비교는 "없음"과 똑같이 답한다 (존재 여부도 알려주지 않음)
  if (!c || c.user_id !== userId) throw new ApiError("not_found", 404, "비교를 찾을 수 없어요");
  return c;
}

async function buildView(c: ComparisonRow): Promise<ComparisonView> {
  const [runs, models, choice, task, sample] = await Promise.all([
    listRunsOf(c.id),
    getModels(c.model_order),
    findChoice(c.id),
    getMyTask(c.user_id, c.task_id),
    findSampleContent(c.sample_id),
  ]);
  return toView({
    comparison: c,
    runs,
    models,
    choice,
    // 화면엔 비교를 만들 때의 유형 스냅샷이 아니라 지금 이름을 보여준다 (병합 반영)
    task: { id: task.taskId, name: task.name, typeName: task.taskType.name },
    sample,
  });
}

/** 1. 비교 만들기: 검증 → 한도 → 샘플 저장 → 순서 섞기 → comparisons(running) */
export async function createComparison(
  userId: string,
  input: CreateComparisonInput,
): Promise<ComparisonView> {
  const modelIds = [...new Set(input.modelIds)];
  if (modelIds.length !== input.modelIds.length) {
    throw new ApiError("duplicate_model", 400, "같은 모델을 두 번 고를 수 없어요");
  }
  if (modelIds.length < MIN_MODELS || modelIds.length > MAX_MODELS) {
    throw new ApiError(
      "model_not_allowed",
      400,
      `모델은 ${MIN_MODELS}~${MAX_MODELS}개를 골라 주세요 (그 이상은 개인 키 필요)`,
    );
  }

  const models = await getModels(modelIds);
  for (const id of modelIds) {
    const m = models.get(id);
    if (!m) throw new ApiError("model_not_allowed", 400, `알 수 없는 모델이에요: ${id}`);
    assertServerRunnable(m, input.settings); // 허용 목록(R-25), 추론 '높음'(R-26)
  }

  const task = await getMyTask(userId, input.taskId); // 내 작업인지 확인 + 현재 유형
  await assertCanCreate(userId); // 하루 5회, 서비스 예산
  const sampleId = await saveSample(userId, task.taskId, input.sample);

  const comparison = await insertComparison({
    user_id: userId,
    task_id: task.taskId,
    task_type_id: task.taskType.id, // 생성 시점 스냅샷 (R-13)
    sample_id: sampleId,
    is_blind: input.blind,
    model_count: modelIds.length,
    model_order: shuffle(modelIds),
    settings: input.settings,
  });
  return buildView(comparison);
}

/** 2. 실행: 모델들을 병렬로 돌리고 성공 2개 이상이면 선택 대기, 아니면 실패 */
export async function runComparison(userId: string, id: string): Promise<ComparisonView> {
  const c = await loadOwned(userId, id);
  if (c.status !== "running") return buildView(c); // 이미 끝난 비교 → 결과만 다시

  const models = await getModels(c.model_order);
  let runs;
  try {
    runs = await executeComparisonRuns({
      comparisonId: c.id,
      userId,
      taskTypeId: c.task_type_id,
      sampleId: c.sample_id,
      prompt: await findSampleContent(c.sample_id), // R-28: 샘플 그대로
      settings: c.settings,
      plan: c.model_order.map((modelId, position) => ({
        model: models.get(modelId) as CatalogModel & { isActive: boolean },
        position,
      })),
    });
  } catch (err) {
    if (err instanceof RunsAlreadyStarted) {
      throw new ApiError("already_running", 409, "이미 실행 중인 비교예요");
    }
    throw err;
  }

  const succeeded = runs.filter((r) => r.status === "success").length;
  const next = succeeded >= MIN_MODELS ? "awaiting_choice" : "failed";
  const updated = await transition(c.id, ["running"], next, { completed_at: new Date().toISOString() });
  return buildView(updated ?? c);
}

/** 비교 다시 보기. 선택 전 블라인드는 그대로 가린다. 24시간 방치면 abandoned */
export async function getComparison(userId: string, id: string): Promise<ComparisonView> {
  let c = await loadOwned(userId, id);
  const waitingSince = c.completed_at ?? c.created_at;
  if (c.status === "awaiting_choice" && Date.now() - new Date(waitingSince).getTime() > ABANDON_AFTER_MS) {
    c = (await transition(c.id, ["awaiting_choice"], "abandoned")) ?? c;
  }
  return buildView(c);
}

/** 3. 선택 → 공개. 비교당 한 번, 바꿀 수 없음 (R-10) */
export async function choose(
  userId: string,
  id: string,
  input: { kind: ChoiceKind; runId?: string; decisionMs?: number },
): Promise<ComparisonView> {
  const c = await loadOwned(userId, id);
  if (c.status === "chosen") throw new ApiError("already_chosen", 409, "이미 선택한 비교예요");
  if (c.status !== "awaiting_choice") {
    throw new ApiError("not_ready", 409, "아직 고를 수 없는 비교예요");
  }

  let chosenRunId: string | null = null;
  if (input.kind === "pick") {
    const runs = await listRunsOf(c.id);
    const run = runs.find((r) => r.id === input.runId);
    if (!run || run.status !== "success") {
      throw new ApiError("invalid_choice", 400, "고를 수 있는 결과가 아니에요");
    }
    chosenRunId = run.id;
  }

  try {
    await insertChoice({
      comparison_id: c.id,
      user_id: userId,
      kind: input.kind,
      chosen_run_id: chosenRunId,
      was_blind: c.is_blind,
      decision_ms: input.decisionMs ?? null,
    });
  } catch (err) {
    if (err instanceof ChoiceAlreadyMade) {
      throw new ApiError("already_chosen", 409, "이미 선택한 비교예요");
    }
    throw err;
  }
  const updated = await transition(c.id, ["awaiting_choice"], "chosen");
  return buildView(updated ?? c);
}

export { remainingToday } from "./limits";
