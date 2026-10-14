import "server-only";
import { ApiError } from "@/lib/api-error";
import { judgeTaskType, type TypeCandidate } from "./grouping";
import {
  exampleNamesByType,
  findMyTask,
  findTypeById,
  findTypeByKey,
  findUnclassified,
  insertTask,
  insertType,
  listActiveTypes,
  resolveMerged,
  searchMyTasks,
  suggestTypes as suggestTypesFromDb,
  typesByIds,
  type TaskRow,
  type TaskTypeRow,
} from "./repository";
import type { ResolvedTask, TaskSuggestion, TaskType } from "./types";

// 작업 모듈의 공개 함수 (docs/architecture.md §3-2 ⑤, 이야기 2).

export const TASK_NAME_MAX = 100;

/** "  자소서   다듬기 " → "자소서 다듬기", 영문은 소문자. 같은 이름 재사용(R-6)의 기준 */
export function normalizeTaskName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toTaskType(row: TaskTypeRow): TaskType {
  return { id: row.id, key: row.key, name: row.name };
}

function toResolved(
  task: TaskRow,
  type: TaskTypeRow,
  flags: { isNewType: boolean; reused: boolean },
): ResolvedTask {
  return {
    taskId: task.id,
    name: task.name,
    taskType: toTaskType(type),
    classifiedBy: task.classified_by,
    ...flags,
  };
}

/** 작업 이름 → 작업 + 유형 (UML-5). pickedTypeId: 자동완성에서 유형을 직접 고른 경우 */
export async function resolveTask(
  userId: string,
  rawName: string,
  opts: { pickedTypeId?: string; samplePreview?: string } = {},
): Promise<ResolvedTask> {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name || name.length > TASK_NAME_MAX) {
    throw new ApiError("invalid_task_name", 400, `작업 이름은 1~${TASK_NAME_MAX}자로 써 주세요`);
  }
  const normalized = normalizeTaskName(name);

  // 1. 예전에 쓴 이름이면 판정 없이 재사용 (R-6). 유형이 병합됐으면 살아남은 쪽으로.
  const existing = await findMyTask(userId, normalized);
  if (existing) {
    const type = await findTypeById(existing.task_type_id);
    if (!type) throw new Error(`task ${existing.id} points to a missing type`);
    return toResolved(existing, await resolveMerged(type), { isNewType: false, reused: true });
  }

  // 2. 자동완성에서 유형을 직접 골랐으면 판정 AI 없이
  if (opts.pickedTypeId) {
    const picked = await findTypeById(opts.pickedTypeId);
    if (!picked || picked.is_unclassified) {
      throw new ApiError("invalid_task_type", 400, "고른 작업 유형을 찾을 수 없어요");
    }
    const type = await resolveMerged(picked);
    const task = await insertTask({
      user_id: userId,
      name,
      name_normalized: normalized,
      task_type_id: type.id,
      classified_by: "user_pick",
    });
    return toResolved(task, type, { isNewType: false, reused: false });
  }

  // 3. 판정 AI로 묶기. 실패하면 "미분류" — 비교는 막지 않는다.
  let type: TaskTypeRow;
  let classifiedBy: TaskRow["classified_by"] = "judge";
  let isNewType = false;
  try {
    const [types, examples] = await Promise.all([listActiveTypes(), exampleNamesByType()]);
    const candidates: TypeCandidate[] = types.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      examples: examples.get(t.id) ?? [],
    }));
    const verdict = await judgeTaskType(name, candidates, opts.samplePreview);

    if (verdict.decision === "reuse") {
      const found = await findTypeByKey(verdict.key);
      if (!found) throw new Error(`judge reused unknown key ${verdict.key}`);
      type = await resolveMerged(found);
    } else if (verdict.decision === "new") {
      const inserted = await insertType({
        key: verdict.key,
        name: verdict.name,
        description: verdict.description,
      });
      type = await resolveMerged(inserted.row);
      isNewType = inserted.created;
    } else {
      type = await findUnclassified();
      classifiedBy = "fallback";
    }
  } catch (err) {
    console.error("[task] grouping failed, using unclassified:", err);
    type = await findUnclassified();
    classifiedBy = "fallback";
  }

  const task = await insertTask({
    user_id: userId,
    name,
    name_normalized: normalized,
    task_type_id: type.id,
    classified_by: classifiedBy,
  });
  // insertTask가 동시 저장으로 기존 행을 돌려줬을 수 있다 → 그 행의 유형 기준으로 답한다
  if (task.task_type_id !== type.id) {
    const actual = await findTypeById(task.task_type_id);
    if (actual) return toResolved(task, await resolveMerged(actual), { isNewType: false, reused: true });
  }
  return toResolved(task, type, { isNewType, reused: false });
}

/** 자동완성 (이야기 2의 ③): 내 예전 작업 이름 + 기존 유형 */
export async function suggestTasks(userId: string, rawQuery: string): Promise<TaskSuggestion[]> {
  const q = rawQuery.trim().replace(/\s+/g, " ").slice(0, TASK_NAME_MAX);
  const [mine, types] = await Promise.all([
    q ? searchMyTasks(userId, q, 3) : Promise.resolve([]),
    suggestTypesFromDb(q, 8),
  ]);

  const typeRows = await typesByIds([...new Set(mine.map((m) => m.task_type_id))]);
  const myItems: TaskSuggestion[] = [];
  for (const m of mine) {
    const row = typeRows.get(m.task_type_id);
    if (!row) continue;
    const type = await resolveMerged(row);
    myItems.push({ kind: "my_task", typeId: type.id, typeName: type.name, taskName: m.name });
  }

  const typeItems: TaskSuggestion[] = types.map((t) => ({
    kind: "type",
    typeId: t.id,
    typeName: t.name,
    comparisons: t.comparisons,
  }));
  return [...myItems, ...typeItems];
}
