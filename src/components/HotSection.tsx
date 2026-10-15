"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Flame } from "lucide-react";
import { useHotEvents } from "@/lib/hooks/useHotEvents";
import { AI_MODELS, HOT_LABELS } from "@/lib/constants";
import ArticleLogo from "@/components/ArticleLogo";
import { getRelativeTimeShort } from "@/lib/utils";
import type { HotEvent, HotType } from "@/lib/types";

export function HotBadge({ type }: { type: HotType }) {
  const { label, color } = HOT_LABELS[type];
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-normal leading-none shrink-0"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  );
}

// 사건 하나 = 카드 하나. 같은 사건의 여러 기사 중 대표 기사(첫 기사)만 보여준다.
function HotEventCard({ event }: { event: HotEvent }) {
  const { lead } = event;
  const model = lead.aiModel ? AI_MODELS.find((m) => m.slug === lead.aiModel) : null;

  return (
    <Link
      href={`/article/${lead.id}`}
      className="group flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-surface/40 p-3 hover:border-border-strong transition-colors"
    >
      <div className="flex items-center gap-2">
        <HotBadge type={event.type} />
        <ArticleLogo article={lead} size={16} />
        {model && (
          <span className="text-[11px] text-text-secondary truncate">{model.name}</span>
        )}
        <span className="ml-auto text-[11px] text-text-tertiary shrink-0">
          {getRelativeTimeShort(event.firstAt)}
        </span>
      </div>
      <p className="text-sm font-semibold text-text-primary">{event.reason}</p>
      <p className="text-xs text-text-secondary line-clamp-2 group-hover:text-primary transition-colors">
        {lead.title}
      </p>
    </Link>
  );
}

// 접힘 상태는 기억한다 — 한 번 접으면 카테고리를 바꾸거나 새로고침해도 다시 펼치기 전까지 접힌 채로.
const COLLAPSED_KEY = "current:hot-collapsed";

// 노출 기간 안의 Hot 사건. 없으면 섹션 자체를 숨긴다. 카테고리와 무관하게 전체 Hot.
export default function HotSection() {
  const { events, isLoading } = useHotEvents();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 접힘 상태를 마운트 후 반영 (서버 렌더와 맞추기 위해 effect에서)
      if (localStorage.getItem(COLLAPSED_KEY) === "1") setOpen(false);
    } catch {}
  }, []);

  function toggle() {
    setOpen((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, prev ? "1" : "0");
      } catch {}
      return !prev;
    });
  }

  if (!isLoading && events.length === 0) return null;

  return (
    <section className={`bg-bg-card border border-border-subtle rounded-2xl ${open ? "p-5" : "px-5 py-3"}`}>
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-controls="hot-events"
        className={`flex w-full items-center gap-2.5 text-left cursor-pointer ${open ? "mb-3" : ""}`}
      >
        <Flame size={20} className="text-orange-500" />
        <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
          Hot
        </h2>
        {!isLoading && (
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
            {events.length}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs text-text-tertiary">
          {open ? "접기" : "펼치기"}
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div id="hot-events" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-bg-surface rounded-xl animate-pulse" />
              ))
            : events.map((event) => <HotEventCard key={event.key} event={event} />)}
        </div>
      )}
    </section>
  );
}
