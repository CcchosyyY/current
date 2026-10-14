"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  EyeOff,
  Eye,
  LogIn,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { AI_MODELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import type { CatalogModel } from "@/modules/catalog/types";
import type { ChoiceKind, ComparisonView } from "@/modules/comparison/types";
import { DEFAULT_SETTINGS, type ModelSettings } from "@/modules/execution/types";
import type { ResolvedTask } from "@/modules/task/types";
import { ApiCallError, compareApi } from "./api";
import ResultSlots from "./ResultSlots";
import TaskNameInput from "./TaskNameInput";

// 비교 화면 (이야기 2·3, plan-stage1 S9). 홈의 가로 슬라이드 오른쪽 패널.
// UI는 1차 — 흐름이 동작하는 것이 목적. 다듬기는 다음 단계.

const SAMPLE_MAX = 8000;
const MIN_MODELS = 2;
const MAX_MODELS = 3;

export default function ComparePanel({ onBack }: { onBack: () => void }) {
  const { user, isLoading } = useAuth();

  return (
    <section className="relative h-full w-1/2 overflow-y-auto bg-[#07070C]">
      <Backdrop />
      <button
        onClick={onBack}
        className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-text-secondary hover:border-white/25 hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> 뉴스로
      </button>

      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16">
        <p className="mb-3 font-mono text-[11px] tracking-[0.3em] text-primary-light">MODEL LAB</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight text-white">
          내 작업에 맞는 모델,{" "}
          <span className="bg-gradient-to-r from-primary-light to-violet-400 bg-clip-text text-transparent">
            직접 비교해서 찾기
          </span>
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          같은 일을 여러 모델에 시키고, 이름을 가린 채 가장 나은 답을 고르세요.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />
          ) : user ? (
            <CompareFlow />
          ) : (
            <LoginGate />
          )}
        </div>
      </div>
    </section>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full bg-violet-600/20 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function LoginGate() {
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        // 로그인 후 다시 이 비교 화면으로
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/?view=compare")}`,
      },
    });
    if (error) setBusy(false);
  }
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
      <p className="text-sm text-text-primary">비교 기록과 내 순위를 남기려면 로그인이 필요해요.</p>
      <p className="mt-1 text-xs text-text-tertiary">하루 5회까지 무료로 비교할 수 있어요.</p>
      <button
        onClick={signIn}
        disabled={busy}
        className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
        Google로 로그인
      </button>
    </div>
  );
}

function CompareFlow() {
  const { showToast } = useToast();
  const [task, setTask] = useState<ResolvedTask | null>(null);
  const [sample, setSample] = useState("");
  const [allowed, setAllowed] = useState<CatalogModel[]>([]);
  const [selected, setSelected] = useState<CatalogModel[]>([]);
  const [blind, setBlind] = useState(true);
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const [view, setView] = useState<ComparisonView | null>(null);
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [choosing, setChoosing] = useState(false);
  const shownAt = useRef<number>(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 기본 모델 3개 + 오늘 남은 횟수 (작업 유형이 정해지면 다시 — 2단계에선 유형별 추천)
  useEffect(() => {
    compareApi
      .suggestModels(task?.taskType.id)
      .then((d) => {
        setAllowed(d.models);
        setSelected((prev) => (prev.length > 0 ? prev : d.models));
        setRemaining(d.remainingToday);
      })
      .catch(() => showToast("모델 목록을 불러오지 못했어요", "error"));
  }, [task?.taskType.id, showToast]);

  const busy = runningSince !== null || choosing;
  const canRun =
    !!task &&
    sample.trim().length > 0 &&
    sample.length <= SAMPLE_MAX &&
    selected.length >= MIN_MODELS &&
    remaining !== 0 &&
    !busy;

  function fail(e: unknown) {
    const message = e instanceof ApiCallError || e instanceof Error ? e.message : "문제가 생겼어요";
    showToast(message, "error");
    if (e instanceof ApiCallError && e.code === "daily_limit") setRemaining(0);
  }

  async function run() {
    if (!task || !canRun) return;
    try {
      const created = await compareApi.create({
        taskId: task.taskId,
        sample,
        modelIds: selected.map((m) => m.id),
        blind,
        settings,
      });
      setView(created.data);
      setRemaining(created.remainingToday);
      setRunningSince(Date.now());
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

      const done = await compareApi.run(created.data.id);
      setView(done);
      shownAt.current = Date.now();
      if (done.status === "failed") {
        // 전부 실패한 비교는 횟수에 안 센다 → 서버 값으로 다시
        compareApi.suggestModels(task.taskType.id).then((d) => setRemaining(d.remainingToday)).catch(() => {});
      }
    } catch (e) {
      fail(e);
    } finally {
      setRunningSince(null);
    }
  }

  async function choose(kind: ChoiceKind, runId?: string) {
    if (!view) return;
    setChoosing(true);
    try {
      setView(await compareApi.choose(view.id, kind, runId, Date.now() - shownAt.current));
    } catch (e) {
      fail(e);
    } finally {
      setChoosing(false);
    }
  }

  function reset(keepInputs: boolean) {
    setView(null);
    if (!keepInputs) {
      setSample("");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── 입력 ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl space-y-6">
        <Field step="01" label="무엇을 하나요?">
          <TaskNameInput resolved={task} onResolved={setTask} onError={(m) => showToast(m, "error")} />
        </Field>

        <Field step="02" label="샘플">
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={6}
            placeholder={"모델에게 보낼 내용을 지시까지 함께 써 주세요.\n예: 다음 자기소개서 문단을 자연스럽게 고쳐줘: 저는 열정 있는 사람 입니다…"}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[13px] leading-relaxed text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/60"
          />
          <p className={`mt-1 text-right text-[11px] ${sample.length > SAMPLE_MAX ? "text-red-400" : "text-text-tertiary"}`}>
            {sample.length.toLocaleString()} / {SAMPLE_MAX.toLocaleString()}
          </p>
        </Field>

        <Field step="03" label="모델">
          <ModelChips
            allowed={allowed}
            selected={selected}
            onChange={setSelected}
            disabled={busy}
          />
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="mt-3 flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-secondary cursor-pointer"
          >
            고급 설정 <ChevronDown size={12} className={showSettings ? "rotate-180" : ""} />
          </button>
          {showSettings && <SettingsPanel value={settings} onChange={setSettings} />}
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            onClick={() => setBlind((b) => !b)}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary cursor-pointer"
            aria-pressed={blind}
          >
            {blind ? <EyeOff size={14} className="text-primary-light" /> : <Eye size={14} />}
            모델 이름 가리기 {blind ? "ON" : "OFF"}
          </button>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-text-tertiary">
              오늘 남은 비교 {remaining ?? "-"}/5
            </span>
            <button
              onClick={run}
              disabled={!canRun}
              title={!task ? "작업 이름을 먼저 입력해 주세요" : undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_-5px] shadow-primary/60 disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              {runningSince !== null ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              비교 실행
            </button>
          </div>
        </div>
        {remaining === 0 && (
          <p className="text-right text-xs text-amber-400">오늘 무료 비교 5회를 다 썼어요. 내일 다시 할 수 있어요.</p>
        )}
      </div>

      {/* ── 결과 ── */}
      {view && (
        <div ref={resultsRef} className="scroll-mt-6 space-y-4">
          <ResultSlots view={view} runningSince={runningSince} choosing={choosing} onChoose={choose} />
          {(view.status === "chosen" || view.status === "failed") && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => reset(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:border-white/25 hover:text-text-primary cursor-pointer"
              >
                <RotateCcw size={13} /> 같은 샘플로 다시
              </button>
              <button
                onClick={() => reset(false)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:border-white/25 hover:text-text-primary cursor-pointer"
              >
                <Plus size={13} /> 새 샘플로
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ step, label, children }: { step: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-2 text-xs text-text-secondary">
        <span className="font-mono text-primary-light">{step}</span>
        {label}
      </p>
      {children}
    </div>
  );
}

function ModelChips({
  allowed,
  selected,
  onChange,
  disabled,
}: {
  allowed: CatalogModel[];
  selected: CatalogModel[];
  onChange: (m: CatalogModel[]) => void;
  disabled: boolean;
}) {
  const addable = allowed.filter((a) => !selected.some((s) => s.id === a.id));
  const color = (brand: string | null) => AI_MODELS.find((m) => m.slug === brand)?.color ?? "#6366F1";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((m) => (
        <span
          key={m.id}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 py-2 pl-3 pr-2 text-xs text-text-primary"
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color(m.brand) }} />
          {m.name}
          <button
            onClick={() => onChange(selected.filter((s) => s.id !== m.id))}
            disabled={disabled || selected.length <= MIN_MODELS}
            aria-label={`${m.name} 빼기`}
            title={selected.length <= MIN_MODELS ? `최소 ${MIN_MODELS}개` : "빼기"}
            className="rounded p-0.5 text-text-tertiary hover:bg-white/10 hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      {addable.map((m) =>
        selected.length < MAX_MODELS ? (
          <button
            key={m.id}
            onClick={() => onChange([...selected, m])}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/15 px-3 py-2 text-xs text-text-tertiary hover:border-white/30 hover:text-text-secondary cursor-pointer"
          >
            <Plus size={12} /> {m.name}
          </button>
        ) : null,
      )}
      <span className="text-[11px] text-text-tertiary">다른 모델은 개인 키 연결 후 (준비 중)</span>
    </div>
  );
}

function SettingsPanel({ value, onChange }: { value: ModelSettings; onChange: (v: ModelSettings) => void }) {
  const opt = (active: boolean, disabled = false) =>
    `rounded-lg border px-2.5 py-1 text-[11px] ${
      disabled
        ? "border-white/5 text-text-tertiary/50 cursor-not-allowed"
        : active
          ? "border-primary/60 bg-primary/15 text-text-primary cursor-pointer"
          : "border-white/10 text-text-secondary hover:border-white/25 cursor-pointer"
    }`;
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] text-text-tertiary">세 모델에 똑같이 적용돼요. 기본은 각 모델의 기본값이에요.</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-24 text-[11px] text-text-secondary">추론 강도</span>
        <button className={opt(value.reasoning === "default")} onClick={() => onChange({ ...value, reasoning: "default" })}>기본</button>
        <button className={opt(value.reasoning === "low")} onClick={() => onChange({ ...value, reasoning: "low" })}>낮음 (빠름)</button>
        <button className={opt(false, true)} disabled title="개인 키 필요 (준비 중)">높음 · 개인 키</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-24 text-[11px] text-text-secondary">최대 답변 길이</span>
        <button className={opt(value.maxLength === "default")} onClick={() => onChange({ ...value, maxLength: "default" })}>기본</button>
        <button className={opt(value.maxLength === "short")} onClick={() => onChange({ ...value, maxLength: "short" })}>짧게</button>
        {value.maxLength === "short" && (
          <span className="text-[11px] text-amber-400/80">추론 모델은 답이 잘리거나 비어 있을 수 있어요</span>
        )}
      </div>
    </div>
  );
}
