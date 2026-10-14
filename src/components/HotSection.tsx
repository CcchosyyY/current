"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
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

// 노출 기간 안의 Hot 사건. 없으면 섹션 자체를 숨긴다.
export default function HotSection() {
  const { events, isLoading } = useHotEvents();

  if (!isLoading && events.length === 0) return null;

  return (
    <section className="bg-bg-card border border-border-subtle rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <Flame size={20} className="text-orange-500" />
        <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
          Hot
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-bg-surface rounded-xl animate-pulse" />
            ))
          : events.map((event) => <HotEventCard key={event.key} event={event} />)}
      </div>
    </section>
  );
}
