"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Equal,
  Loader2,
  Maximize2,
  ThumbsDown,
  X,
} from "lucide-react";
import { AI_MODELS } from "@/lib/constants";
import type { ChoiceKind, ComparisonView, SlotView } from "@/modules/comparison/types";

// A·B·C 결과 칸 + 선택 + 공개 (이야기 3의 ⑩~⑫).
// - 칸마다 따로: 끝난 모델은 바로 보이고, 아직 실행 중인 칸만 시간이 흐른다.
// - 칸은 화면 높이에 맞춰 길게, 칸마다 따로 스크롤. "크게 보기"로 한 답을 화면 가득.
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
const isPending = (s: SlotView) => s.status === "pending" || s.status === "running";
const isFailed = (s: SlotView) => s.status === "error" || s.status === "timeout";

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono tabular-nums">{((now - since) / 1000).toFixed(1)}초</span>;
}

interface Props {
  view: ComparisonView;
  runningSince: number | null; // 실행을 시작한 시각 (실행 중인 칸의 경과 시간)
  choosing: boolean;
  onChoose: (kind: ChoiceKind, runId?: string) => void;
}

export default function ResultSlots({ view, runningSince, choosing, onChoose }: Props) {
  const [focus, setFocus] = useState<number | null>(null); // 크게 보기 중인 칸
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
            runningSince={runningSince}
            canChoose={canChoose}
            chosen={slot.runId !== null && slot.runId === chosenRunId}
            onPick={() => slot.runId && onChoose("pick", slot.runId)}
            onExpand={() => setFocus(slot.position)}
          />
        ))}
      </div>

      <ChoiceFooter view={view} canChoose={canChoose} onChoose={onChoose} />

      {focus !== null && (
        <FocusView
          view={view}
          position={focus}
          canChoose={canChoose}
          chosenRunId={chosenRunId}
          runningSince={runningSince}
          onMove={setFocus}
          onClose={() => setFocus(null)}
          onPick={(runId) => {
            onChoose("pick", runId);
            setFocus(null);
          }}
        />
      )}
    </div>
  );
}

function ChoiceFooter({
  view,
  canChoose,
  onChoose,
}: {
  view: ComparisonView;
  canChoose: boolean;
  onChoose: (kind: ChoiceKind) => void;
}) {
  if (view.status === "awaiting_choice") {
    return (
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
    );
  }
  if (view.status === "chosen" && view.choice && view.choice.kind !== "pick") {
    return (
      <p className="mt-4 text-center text-xs text-text-secondary">
        {view.choice.kind === "tie" ? "“셋 다 비슷함”으로 기록했어요" : "“전부 별로”로 기록했어요"}
      </p>
    );
  }
  if (view.status === "failed") {
    return (
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-amber-400">
        <AlertTriangle size={13} /> 2개 이상 실패해서 비교할 수 없어요. 오늘 횟수에는 세지 않아요.
      </p>
    );
  }
  return null;
}

function SlotHeader({ slot, chosen }: { slot: SlotView; chosen: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 font-mono text-xs text-text-primary">
        {LETTERS[slot.position]}
      </span>
      {slot.model && (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-primary">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: brandColor(slot.model.brand) }} />
          <span className="truncate">{slot.model.name}</span>
        </span>
      )}
      {chosen && (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-primary-light">
          <Check size={12} /> 선택
        </span>
      )}
    </div>
  );
}

function SlotBody({ slot, runningSince, large }: { slot: SlotView; runningSince: number | null; large?: boolean }) {
  if (isPending(slot)) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-xs text-text-tertiary">
        <Loader2 size={18} className="animate-spin text-primary-light" />
        {runningSince !== null ? <Elapsed since={runningSince} /> : "실행 중"}
      </div>
    );
  }
  if (isFailed(slot)) {
    return (
      <p className="flex items-start gap-1.5 py-6 text-xs text-amber-400">
        <AlertTriangle size={13} className="mt-0.5 shrink-0" />
        {ERROR_TEXT[slot.errorCode ?? ""] ?? "실패했어요"}
      </p>
    );
  }
  return (
    <p
      className={`whitespace-pre-wrap break-words text-text-primary ${
        large ? "text-[15px] leading-8" : "text-[13px] leading-relaxed"
      }`}
    >
      {slot.output}
    </p>
  );
}

function Slot({
  slot,
  runningSince,
  canChoose,
  chosen,
  onPick,
  onExpand,
}: {
  slot: SlotView;
  runningSince: number | null;
  canChoose: boolean;
  chosen: boolean;
  onPick: () => void;
  onExpand: () => void;
}) {
  return (
    <div
      // 화면 높이에 맞춘 긴 칸 (헤더·요약줄·선택 버튼 자리를 뺀 높이)
      className={`flex h-[calc(100vh-260px)] min-h-[420px] flex-col rounded-2xl border bg-black/30 transition-colors ${
        chosen ? "border-primary shadow-[0_0_24px_-6px] shadow-primary/60" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="min-w-0 flex-1">
          <SlotHeader slot={slot} chosen={chosen} />
        </div>
        {slot.status === "success" && (
          <button
            onClick={onExpand}
            aria-label={`${LETTERS[slot.position]} 크게 보기`}
            title="크게 보기"
            className="rounded-md p-1 text-text-tertiary hover:bg-white/10 hover:text-text-primary cursor-pointer"
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <SlotBody slot={slot} runningSince={runningSince} />
      </div>

      {!isPending(slot) && (
        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3 text-[11px] text-text-tertiary">
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

/** 크게 보기: 한 답을 화면 가득. A·B·C 탭과 ←/→로 넘기고, 여기서 바로 고를 수 있다 */
function FocusView({
  view,
  position,
  canChoose,
  chosenRunId,
  runningSince,
  onMove,
  onClose,
  onPick,
}: {
  view: ComparisonView;
  position: number;
  canChoose: boolean;
  chosenRunId: string | null;
  runningSince: number | null;
  onMove: (p: number) => void;
  onClose: () => void;
  onPick: (runId: string) => void;
}) {
  const slot = view.slots[position];
  const count = view.slots.length;
  const move = useCallback((d: number) => onMove((position + d + count) % count), [position, count, onMove]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    }
    // 캡처 단계: 홈 슬라이드의 Esc(뉴스로)보다 먼저 받아서 창만 닫는다
    window.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = "";
    };
  }, [move, onClose]);

  // 홈 슬라이드는 transform이 걸려 있어 그 안에선 fixed가 화면 기준이 아니다 → body로 portal
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07070C]/95 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-3">
        {view.slots.map((s) => (
          <button
            key={s.position}
            onClick={() => onMove(s.position)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer ${
              s.position === position ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <span className="font-mono">{LETTERS[s.position]}</span>
            {s.model?.name}
            {isPending(s) && <Loader2 size={11} className="animate-spin" />}
          </button>
        ))}
        <span className="ml-3 text-[11px] text-text-tertiary">← → 로 넘기기 · Esc 닫기</span>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="ml-auto rounded-lg p-1.5 text-text-tertiary hover:bg-white/10 hover:text-text-primary cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <button onClick={() => move(-1)} aria-label="이전" className="px-4 text-text-tertiary hover:text-text-primary cursor-pointer">
          <ChevronLeft size={28} />
        </button>
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-col py-6">
          <SlotHeader slot={slot} chosen={slot.runId !== null && slot.runId === chosenRunId} />
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
            <SlotBody slot={slot} runningSince={runningSince} large />
          </div>
          {!isPending(slot) && (
            <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatSeconds(slot.latencyMs)}
              </span>
              {"costUsd" in slot && <span>{formatCost(slot.costUsd)}</span>}
              {slot.status === "success" && canChoose && slot.runId && (
                <button
                  onClick={() => onPick(slot.runId!)}
                  className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark cursor-pointer"
                >
                  {LETTERS[slot.position]}가 낫다
                </button>
              )}
            </div>
          )}
        </div>
        <button onClick={() => move(1)} aria-label="다음" className="px-4 text-text-tertiary hover:text-text-primary cursor-pointer">
          <ChevronRight size={28} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
