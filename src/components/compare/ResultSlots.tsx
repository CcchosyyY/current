"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Equal, ThumbsDown, AlertTriangle, Clock } from "lucide-react";
import { AI_MODELS } from "@/lib/constants";
import type { ChoiceKind, ComparisonView, SlotView } from "@/modules/comparison/types";

// A·B·C 결과 칸 + 선택 + 공개 (이야기 3의 ⑩~⑫).
// 블라인드일 때 모델 이름은 서버 응답에 아예 없다 — 이 컴포넌트는 받은 것만 보여준다.

const LETTERS = "ABCDEFGHIJ";

function brandColor(brand: string | null | undefined): string {
  return AI_MODELS.find((m) => m.slug === brand)?.color ?? "#6366F1";
}

function formatSeconds(ms: number | null): string {
  return ms === null ? "-" : `${(ms / 1000).toFixed(1)}초`;
}

function formatCost(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return "-";
  return usd < 0.01 ? `$${usd.toFixed(5)}` : `$${usd.toFixed(3)}`;
}

const ERROR_TEXT: Record<string, string> = {
  timeout: "시간 초과 (60초)",
  empty_output: "답이 비어 있어요 (답변 길이 '짧게'면 생길 수 있어요)",
  rate_limited: "요청이 많아 거절됐어요",
  insufficient_credits: "크레딧 한도에 도달했어요",
  provider_error: "모델 쪽 오류",
};

/** 실행 중 경과 시간 */
function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono">{((now - since) / 1000).toFixed(1)}초</span>;
}

interface Props {
  view: ComparisonView;
  runningSince: number | null; // 실행 중이면 시작 시각
  choosing: boolean;
  onChoose: (kind: ChoiceKind, runId?: string) => void;
}

export default function ResultSlots({ view, runningSince, choosing, onChoose }: Props) {
  const canChoose = view.status === "awaiting_choice" && !choosing;
  const chosenRunId = view.choice?.runId ?? null;

  return (
    <div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${view.slots.length}, minmax(0, 1fr))` }}
      >
        {view.slots.map((slot) => (
          <Slot
            key={slot.position}
            slot={slot}
            running={runningSince !== null}
            runningSince={runningSince}
            canChoose={canChoose}
            chosen={slot.runId !== null && slot.runId === chosenRunId}
            onPick={() => slot.runId && onChoose("pick", slot.runId)}
          />
        ))}
      </div>

      {view.status === "awaiting_choice" && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-2 text-xs text-text-tertiary">
            {view.isBlind ? "고르면 어떤 모델이었는지 공개돼요" : "가장 나은 답을 골라 주세요"}
          </span>
          <button
            disabled={!canChoose}
            onClick={() => onChoose("tie")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:border-white/25 hover:text-text-primary disabled:opacity-50 cursor-pointer"
          >
            <Equal size={13} /> 셋 다 비슷함
          </button>
          <button
            disabled={!canChoose}
            onClick={() => onChoose("all_bad")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:border-white/25 hover:text-text-primary disabled:opacity-50 cursor-pointer"
          >
            <ThumbsDown size={13} /> 전부 별로
          </button>
        </div>
      )}

      {view.status === "chosen" && view.choice && view.choice.kind !== "pick" && (
        <p className="mt-4 text-center text-xs text-text-secondary">
          {view.choice.kind === "tie" ? "“셋 다 비슷함”으로 기록했어요" : "“전부 별로”로 기록했어요"}
        </p>
      )}

      {view.status === "failed" && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-amber-400">
          <AlertTriangle size={13} /> 2개 이상 실패해서 비교할 수 없어요. 오늘 횟수에는 세지 않아요.
        </p>
      )}
    </div>
  );
}

function Slot({
  slot,
  running,
  runningSince,
  canChoose,
  chosen,
  onPick,
}: {
  slot: SlotView;
  running: boolean;
  runningSince: number | null;
  canChoose: boolean;
  chosen: boolean;
  onPick: () => void;
}) {
  const failed = slot.status === "error" || slot.status === "timeout";
  const color = slot.model ? brandColor(slot.model.brand) : null;

  return (
    <div
      className={`flex min-h-[260px] flex-col rounded-2xl border bg-black/30 p-4 transition-colors ${
        chosen ? "border-primary shadow-[0_0_24px_-6px] shadow-primary/60" : "border-white/10"
      }`}
    >
      {/* 머리: A/B/C + (공개되면) 모델 이름 */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 font-mono text-xs text-text-primary">
          {LETTERS[slot.position]}
        </span>
        {slot.model ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-primary">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color ?? undefined }} />
            <span className="truncate">{slot.model.name}</span>
          </span>
        ) : null}
        {chosen && (
          <span className="ml-auto flex items-center gap-1 text-[11px] text-primary-light">
            <Check size={12} /> 선택
          </span>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto max-h-[340px] pr-1">
        {running ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-xs text-text-tertiary">
            <Loader2 size={18} className="animate-spin text-primary-light" />
            {runningSince !== null && <Elapsed since={runningSince} />}
          </div>
        ) : failed ? (
          <p className="flex items-start gap-1.5 py-6 text-xs text-amber-400">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            {ERROR_TEXT[slot.errorCode ?? ""] ?? "실패했어요"}
          </p>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text-primary">
            {slot.output}
          </p>
        )}
      </div>

      {/* 발: 속도(항상) · 비용(공개 후) · 선택 버튼 */}
      {!running && (
        <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-[11px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatSeconds(slot.latencyMs)}
          </span>
          {"costUsd" in slot && <span>{formatCost(slot.costUsd)}</span>}
          {slot.status === "success" && canChoose && (
            <button
              onClick={onPick}
              className="ml-auto rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary cursor-pointer"
            >
              이게 낫다
            </button>
          )}
        </div>
      )}
    </div>
  );
}
