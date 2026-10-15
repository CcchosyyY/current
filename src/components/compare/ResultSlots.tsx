"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Equal,
  Loader2,
  Maximize2,
  RectangleHorizontal,
  ThumbsDown,
  X,
} from "lucide-react";
import { AI_MODELS } from "@/lib/constants";
import type { ChoiceKind, ComparisonView, SlotView } from "@/modules/comparison/types";
import Markdown, { type MarkdownSize } from "./Markdown";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { Messages } from "@/lib/i18n/messages";

// A·B·C 결과 칸 + 선택 + 공개 (이야기 3의 ⑩~⑫).
// - 칸마다 따로: 끝난 모델은 바로 보이고, 아직 실행 중인 칸만 시간이 흐른다.
// - 보기 방식 두 가지: "하나씩"(기본 — A·B·C 탭 + 넓은 한 칸) / "나란히"(칸을 가로로 나란히).
//   화면 폭이 좁아 세 칸을 나란히 두면 답이 너무 좁아지므로 기본은 하나씩. 고른 방식은 기억한다.
// - 하나씩: 처음엔 먼저 끝난 모델 탭을 따라가다가, 사용자가 탭을 누르면 그 탭에 머문다.
//   ←/→ 또는 숫자 키 1·2·3으로 탭 이동. 나란히: 숫자 키로 바로 고르기.
// - "크게 보기"로 한 답을 화면 가득. 입력 칸에 커서가 있을 땐 키를 무시한다.
// 블라인드일 때 모델 이름은 서버 응답에 아예 없다 — 이 컴포넌트는 받은 것만 보여준다.

const LETTERS = "ABCDEFGHIJ";

function brandColor(brand: string | null | undefined): string {
  return AI_MODELS.find((m) => m.slug === brand)?.color ?? "#6366F1";
}
function formatSeconds(ms: number | null, m: Messages): string {
  return ms === null ? "-" : m.compare.seconds((ms / 1000).toFixed(1));
}
function formatCost(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return "-";
  return usd < 0.01 ? `$${usd.toFixed(5)}` : `$${usd.toFixed(3)}`;
}
type Layout = "tabs" | "side";
const LAYOUT_KEY = "current:compare-layout";
function loadLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "side" ? "side" : "tabs";
  } catch {
    return "tabs";
  }
}
function isTyping(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

const isPending = (s: SlotView) => s.status === "pending" || s.status === "running";
const isFailed = (s: SlotView) => s.status === "error" || s.status === "timeout";

function Elapsed({ since }: { since: number }) {
  const m = useMessages();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono tabular-nums">{m.compare.seconds(((now - since) / 1000).toFixed(1))}</span>;
}

interface Props {
  view: ComparisonView;
  runningSince: number | null; // 실행을 시작한 시각 (실행 중인 칸의 경과 시간)
  choosing: boolean;
  onChoose: (kind: ChoiceKind, runId?: string) => void;
}

export default function ResultSlots({ view, runningSince, choosing, onChoose }: Props) {
  const m = useMessages();
  const [focus, setFocus] = useState<number | null>(null); // 크게 보기 중인 칸
  const [layout, setLayout] = useState<Layout>(loadLayout);
  const [pickedTab, setPickedTab] = useState<number | null>(null); // 사용자가 누른 탭
  const canChoose = view.status === "awaiting_choice" && !choosing;
  const chosenRunId = view.choice?.runId ?? null;
  const count = view.slots.length;

  // 탭을 누르기 전에는 먼저 끝난 모델을 보여준다
  const firstDone = view.slots.findIndex((s) => !isPending(s));
  const active = pickedTab ?? (firstDone >= 0 ? firstDone : 0);

  function changeLayout(next: Layout) {
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {}
  }

  // 키보드 — 하나씩: ←/→·숫자로 탭 이동 / 나란히: 숫자로 고르기. 크게 보기 창이 열려 있으면 그 창이 받는다.
  useEffect(() => {
    if (focus !== null) return;
    function onKey(e: KeyboardEvent) {
      if (isTyping(e)) return;
      const n = Number(e.key) - 1;
      if (layout === "tabs") {
        if (e.key === "ArrowLeft") setPickedTab((active - 1 + count) % count);
        else if (e.key === "ArrowRight") setPickedTab((active + 1) % count);
        else if (n >= 0 && n < count) setPickedTab(n);
        return;
      }
      const slot = view.slots[n];
      if (canChoose && slot?.status === "success" && slot.runId) onChoose("pick", slot.runId);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, layout, active, count, canChoose, view.slots, onChoose]);

  const slotProps = (slot: SlotView) => ({
    slot,
    runningSince,
    canChoose,
    chosen: slot.runId !== null && slot.runId === chosenRunId,
    onPick: () => slot.runId && onChoose("pick", slot.runId),
    onExpand: () => setFocus(slot.position),
  });

  return (
    <div>
      {/* 가운데: 탭(하나씩일 때) / 오른쪽: 보기 방식 전환 */}
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div />
        {layout === "tabs" ? (
          <div role="tablist" className="flex min-w-0 justify-center gap-3 overflow-x-auto">
            {view.slots.map((slot) => (
              <SlotTab
                key={slot.position}
                slot={slot}
                active={slot.position === active}
                chosen={slot.runId !== null && slot.runId === chosenRunId}
                onClick={() => setPickedTab(slot.position)}
              />
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="flex shrink-0 justify-self-end rounded-xl border border-white/10 bg-black/30 p-1" role="group" aria-label={m.compare.viewMode}>
          <LayoutButton active={layout === "tabs"} onClick={() => changeLayout("tabs")} icon={<RectangleHorizontal size={15} />} label={m.compare.oneAtATime} />
          <LayoutButton active={layout === "side"} onClick={() => changeLayout("side")} icon={<Columns3 size={15} />} label={m.compare.sideBySide} />
        </div>
      </div>

      {layout === "tabs" ? (
        <div role="tabpanel">
          <Slot {...slotProps(view.slots[active])} wide />
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {view.slots.map((slot) => (
            <Slot key={slot.position} {...slotProps(slot)} />
          ))}
        </div>
      )}

      <ChoiceFooter view={view} canChoose={canChoose} onChoose={onChoose} layout={layout} />

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

function LayoutButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors ${
        active ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** 하나씩 보기의 탭 (두 줄): 위 — 글자 + 상태 / 아래 — (공개됐으면) 모델 이름, 아니면 걸린 시간 */
function SlotTab({ slot, active, chosen, onClick }: { slot: SlotView; active: boolean; chosen: boolean; onClick: () => void }) {
  const m = useMessages();
  const status = isPending(slot) ? (
    <Loader2 size={16} className="animate-spin text-primary-light" />
  ) : isFailed(slot) ? (
    <AlertTriangle size={16} className="text-amber-400" />
  ) : chosen ? (
    <Check size={17} className="text-primary-light" />
  ) : null;
  const sub = isPending(slot) ? m.compare.running : isFailed(slot) ? m.compare.failedShort : formatSeconds(slot.latencyMs, m);

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-w-[8.5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-6 py-3.5 cursor-pointer transition-colors ${
        active
          ? "border-primary/70 bg-primary/15 text-text-primary shadow-[0_0_24px_-8px] shadow-primary/70"
          : "border-white/10 bg-black/25 text-text-secondary hover:border-white/25 hover:text-text-primary"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="font-mono text-2xl font-bold leading-none">{LETTERS[slot.position]}</span>
        {status}
      </span>
      {slot.model ? (
        <span className="flex max-w-[12rem] items-center gap-1.5 text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: brandColor(slot.model.brand) }} />
          <span className="truncate">{slot.model.name}</span>
        </span>
      ) : (
        <span className={`font-mono text-base ${isPending(slot) || isFailed(slot) ? "text-text-tertiary" : "font-semibold text-white"}`}>
          {sub}
        </span>
      )}
    </button>
  );
}

function ChoiceFooter({
  view,
  canChoose,
  onChoose,
  layout,
}: {
  view: ComparisonView;
  canChoose: boolean;
  onChoose: (kind: ChoiceKind) => void;
  layout: Layout;
}) {
  const m = useMessages();
  if (view.status === "awaiting_choice") {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <span className="mr-2 text-sm text-text-tertiary">
          {view.isBlind ? m.compare.revealHint : m.compare.pickBest}
          <span className="ml-2 hidden font-mono text-xs sm:inline">
            {layout === "tabs" ? m.compare.arrowHint : m.compare.keyHint(view.slots.length)}
          </span>
        </span>
        <button
          disabled={!canChoose}
          onClick={() => onChoose("tie")}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-text-secondary hover:border-white/25 hover:text-text-primary disabled:opacity-50 cursor-pointer"
        >
          <Equal size={16} /> {m.compare.tie(view.slots.length)}
        </button>
        <button
          disabled={!canChoose}
          onClick={() => onChoose("all_bad")}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-text-secondary hover:border-white/25 hover:text-text-primary disabled:opacity-50 cursor-pointer"
        >
          <ThumbsDown size={16} /> {m.compare.allBad}
        </button>
      </div>
    );
  }
  if (view.status === "chosen" && view.choice && view.choice.kind !== "pick") {
    return (
      <p className="mt-5 text-center text-sm text-text-secondary">
        {view.choice.kind === "tie"
          ? m.compare.recordedTie(m.compare.tie(view.slots.length))
          : m.compare.recordedAllBad}
      </p>
    );
  }
  if (view.status === "failed") {
    return (
      <p className="mt-5 flex items-center justify-center gap-2 text-sm text-amber-400">
        <AlertTriangle size={16} /> {m.compare.tooManyFailed}
      </p>
    );
  }
  return null;
}

function SlotHeader({ slot, chosen }: { slot: SlotView; chosen: boolean }) {
  const m = useMessages();
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-base font-semibold text-text-primary">
        {LETTERS[slot.position]}
      </span>
      {slot.model && (
        <span className="flex min-w-0 items-center gap-2 text-lg font-semibold text-text-primary">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: brandColor(slot.model.brand) }} />
          <span className="truncate">{slot.model.name}</span>
        </span>
      )}
      {chosen && (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-base text-primary-light">
          <Check size={17} /> {m.compare.chosen}
        </span>
      )}
    </div>
  );
}

function SlotBody({ slot, runningSince, size = "sm" }: { slot: SlotView; runningSince: number | null; size?: MarkdownSize }) {
  const m = useMessages();
  if (isPending(slot)) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2.5 text-sm text-text-tertiary">
        <Loader2 size={24} className="animate-spin text-primary-light" />
        {runningSince !== null ? (
          <span className="text-base font-semibold text-white">
            <Elapsed since={runningSince} />
          </span>
        ) : (
          m.compare.running
        )}
      </div>
    );
  }
  if (isFailed(slot)) {
    return (
      <p className="flex items-start gap-2 py-6 text-sm text-amber-400">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {m.compare.errors[slot.errorCode ?? ""] ?? m.compare.failed}
      </p>
    );
  }
  return <Markdown text={slot.output ?? ""} size={size} />;
}

function Slot({
  slot,
  runningSince,
  canChoose,
  chosen,
  onPick,
  onExpand,
  wide = false,
}: {
  slot: SlotView;
  runningSince: number | null;
  canChoose: boolean;
  chosen: boolean;
  onPick: () => void;
  onExpand: () => void;
  wide?: boolean; // 하나씩 보기: 넓은 한 칸, 글자 크게, 본문은 읽기 좋은 폭으로 가운데
}) {
  const m = useMessages();
  return (
    <div
      // 화면 높이에 맞춘 긴 칸 (헤더·요약줄·선택 버튼 자리를 뺀 높이)
      className={`flex h-[calc(100vh-260px)] min-h-[420px] flex-col rounded-2xl border bg-black/30 transition-colors ${
        chosen ? "border-primary shadow-[0_0_24px_-6px] shadow-primary/60" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <SlotHeader slot={slot} chosen={chosen} />
        </div>
        {slot.status === "success" && (
          <button
            onClick={onExpand}
            aria-label={m.compare.expand(LETTERS[slot.position])}
            title={m.compare.expandTitle}
            className="rounded-md p-1.5 text-text-tertiary hover:bg-white/10 hover:text-text-primary cursor-pointer"
          >
            <Maximize2 size={17} />
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto ${wide ? "px-6 py-5 md:px-10" : "px-5 py-4"}`}>
        <div className={wide ? "mx-auto max-w-4xl" : undefined}>
          <SlotBody slot={slot} runningSince={runningSince} size={wide ? "md" : "sm"} />
        </div>
      </div>

      {!isPending(slot) && (
        <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3.5 text-sm text-text-tertiary">
          <span className="flex items-center gap-1.5 font-mono text-base font-semibold text-white">
            <Clock size={16} /> {formatSeconds(slot.latencyMs, m)}
          </span>
          {"costUsd" in slot && <span className="font-mono text-white/80">{formatCost(slot.costUsd)}</span>}
          {slot.status === "success" && canChoose && (
            <button
              onClick={onPick}
              className="ml-auto rounded-xl bg-primary/90 px-4 py-2 text-sm font-semibold text-white hover:bg-primary cursor-pointer"
            >
              {wide ? m.compare.letterBetter(LETTERS[slot.position]) : m.compare.thisBetter}
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
  const m = useMessages();
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
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm cursor-pointer ${
              s.position === position ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <span className="font-mono">{LETTERS[s.position]}</span>
            {s.model?.name}
            {isPending(s) && <Loader2 size={11} className="animate-spin" />}
          </button>
        ))}
        <span className="ml-3 text-xs text-text-tertiary">{m.compare.focusHint}</span>
        <button
          onClick={onClose}
          aria-label={m.compare.close}
          className="ml-auto rounded-lg p-1.5 text-text-tertiary hover:bg-white/10 hover:text-text-primary cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <button onClick={() => move(-1)} aria-label={m.compare.prev} className="px-4 text-text-tertiary hover:text-text-primary cursor-pointer">
          <ChevronLeft size={28} />
        </button>
        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-col py-6">
          <SlotHeader slot={slot} chosen={slot.runId !== null && slot.runId === chosenRunId} />
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
            <SlotBody slot={slot} runningSince={runningSince} size="lg" />
          </div>
          {!isPending(slot) && (
            <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-4 text-sm text-text-tertiary">
              <span className="flex items-center gap-1.5 font-mono text-lg font-semibold text-white">
                <Clock size={17} /> {formatSeconds(slot.latencyMs, m)}
              </span>
              {"costUsd" in slot && <span className="font-mono text-white/80">{formatCost(slot.costUsd)}</span>}
              {slot.status === "success" && canChoose && slot.runId && (
                <button
                  onClick={() => onPick(slot.runId!)}
                  className="ml-auto rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-white hover:bg-primary-dark cursor-pointer"
                >
                  {m.compare.letterBetter(LETTERS[slot.position])}
                </button>
              )}
            </div>
          )}
        </div>
        <button onClick={() => move(1)} aria-label={m.compare.next} className="px-4 text-text-tertiary hover:text-text-primary cursor-pointer">
          <ChevronRight size={28} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
