import "server-only";
import type { CatalogModel } from "@/modules/catalog/types";
import type { RunRecord } from "@/modules/execution/types";
import type { ComparisonRow, ChoiceRow } from "./repository";
import type { ComparisonView, SlotView } from "./types";

/**
 * 블라인드 규칙 (R-8) — 비교를 화면 모양으로 바꾸는 **유일한** 함수.
 *
 * 블라인드 비교가 아직 선택 전(running / awaiting_choice)이면 칸마다 model·costUsd
 * 키를 객체에서 아예 뺀다. 화면에서 가리는 게 아니라 서버가 보내지 않는다 —
 * 개발자 도구 Network 탭으로도 모델을 알 수 없다. 응답 속도는 보낸다.
 *
 * 실패·방치된 비교는 더 이상 고를 수 없으니 공개한다.
 */
export function isRevealed(c: Pick<ComparisonRow, "is_blind" | "status">): boolean {
  return !c.is_blind || !(c.status === "running" || c.status === "awaiting_choice");
}

export function toView(input: {
  comparison: ComparisonRow;
  runs: RunRecord[];
  models: Map<string, CatalogModel>;
  choice: ChoiceRow | null;
  task: { id: string; name: string; typeName: string };
  sample: string;
}): ComparisonView {
  const { comparison: c } = input;
  const revealed = isRevealed(c);
  const runsByPosition = new Map(input.runs.map((r) => [r.displayPosition, r]));

  const slots: SlotView[] = c.model_order.map((modelId, position) => {
    const run = runsByPosition.get(position);
    const slot: SlotView = {
      position,
      runId: run?.id ?? null,
      status: run ? run.status : c.status === "running" ? "pending" : "error",
      output: run?.outputText ?? null,
      errorCode: run?.errorCode ?? null,
      latencyMs: run?.latencyMs ?? null,
    };
    if (revealed) {
      const m = input.models.get(modelId);
      slot.model = { id: modelId, name: m?.name ?? modelId, brand: m?.brand ?? null };
      slot.costUsd = run?.costUsd ?? null;
    }
    return slot;
  });

  return {
    id: c.id,
    status: c.status,
    isBlind: c.is_blind,
    revealed,
    settings: c.settings,
    task: input.task,
    sample: input.sample,
    createdAt: c.created_at,
    slots,
    choice: input.choice ? { kind: input.choice.kind, runId: input.choice.chosen_run_id } : null,
  };
}
