// 비교 화면이 쓰는 API 호출 (브라우저). 응답 모양은 docs/plan-stage1.md S7 API 계약.

import type { CatalogModel } from "@/modules/catalog/types";
import type { ChoiceKind, ComparisonView } from "@/modules/comparison/types";
import type { ModelSettings } from "@/modules/execution/types";
import type { ResolvedTask } from "@/modules/task/types";

export class ApiCallError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiCallError(
      body?.error?.code ?? "unknown",
      body?.error?.message ?? "Request failed", // 화면은 오류 코드로 언어별 문구를 고른다 (unknown)
      res.status,
    );
  }
  return body as T;
}

export const compareApi = {
  resolveFromSample: (sample: string) =>
    call<{ data: ResolvedTask }>("/api/tasks/from-sample", { method: "POST", json: { sample } }).then(
      (r) => r.data,
    ),

  suggestModels: (taskTypeId?: string) =>
    call<{ data: { models: CatalogModel[]; remainingToday: number } }>(
      `/api/comparisons/suggest${taskTypeId ? `?taskTypeId=${taskTypeId}` : ""}`,
    ).then((r) => r.data),

  create: (input: {
    taskId: string;
    sample: string;
    modelIds: string[];
    blind: boolean;
    settings: ModelSettings;
  }) =>
    call<{ data: ComparisonView; remainingToday: number }>("/api/comparisons", {
      method: "POST",
      json: input,
    }),

  get: (id: string, signal?: AbortSignal) =>
    call<{ data: ComparisonView }>(`/api/comparisons/${id}`, { signal }).then((r) => r.data),

  run: (id: string) =>
    call<{ data: ComparisonView }>(`/api/comparisons/${id}/run`, { method: "POST" }).then((r) => r.data),

  choose: (id: string, kind: ChoiceKind, runId?: string, decisionMs?: number) =>
    call<{ data: ComparisonView }>(`/api/comparisons/${id}/choice`, {
      method: "POST",
      json: { kind, runId, decisionMs },
    }).then((r) => r.data),
};
