"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronUp, LayoutGrid, Plus } from "lucide-react";
import { AI_MODELS, CATEGORIES } from "@/lib/constants";
import type { AIModel } from "@/lib/types";
import ModelCard from "@/components/ModelCard";
import { MODEL_SECTIONS, SECTION_FALLBACK } from "@/lib/model-sections";

const sectionId = (slug: string) => `models-${slug}`;
// 맨 위에 보여줄 제일 유명한 5개
const FEATURED = ["chatgpt", "claude", "gemini", "grok", "perplexity"];
// 묶음마다 처음엔 이만큼만 (넓은 화면 5칸 × 2줄). 나머지는 "+" 칸으로 펼친다
const PREVIEW = 10;

function ModelsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const groups = useMemo(() => {
    const bySlug = new Map<string, AIModel>(AI_MODELS.map((m) => [m.slug, m]));
    const used = new Set<string>();
    const list = MODEL_SECTIONS.map((s) => {
      const items = s.models.map((slug) => bySlug.get(slug)).filter((m): m is AIModel => !!m);
      items.forEach((m) => used.add(m.slug));
      const cat = CATEGORIES.find((c) => c.slug === s.slug);
      return { slug: s.slug, label: cat?.name ?? s.slug, color: cat?.color, items };
    }).filter((g) => g.items.length > 0);
    const rest = AI_MODELS.filter((m) => !used.has(m.slug));
    if (rest.length) list.push({ slug: "etc", label: "기타", color: undefined, items: rest });
    return list;
  }, []);

  const [allOpen, setAllOpen] = useState(false);
  const allModels = useMemo(() => {
    const featured = FEATURED.map((slug) => AI_MODELS.find((m) => m.slug === slug)).filter((m): m is AIModel => !!m);
    return [...featured, ...AI_MODELS.filter((m) => !FEATURED.includes(m.slug))];
  }, []);

  // ?category= 가 바뀌면 그 묶음으로 스크롤 (사이드바 클릭·칩 클릭·주소로 들어오기 모두)
  useEffect(() => {
    if (!category) return;
    const target = SECTION_FALLBACK[category] ?? category;
    if (target === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(sectionId(target))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [category]);

  return (
    <div className="space-y-20">
      {/* 맨 위: 제일 유명한 모델 5개 (사이드바 "전체"를 누르면 여기로) */}
      <section>
        {/* 제목 왼쪽 · 접기 버튼 가운데 (3칸: 제목 | 버튼 | 빈칸) */}
        <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-text-primary">
            <LayoutGrid size={24} className="text-primary" />
            AI Models
            <span className="text-sm font-medium text-text-tertiary tabular-nums">{AI_MODELS.length}</span>
          </h1>
          {/* 이 묶음만 특별히: 펼쳤을 때 접기 버튼을 위에도 — 79개 아래까지 내려가지 않고 접게 */}
          {allOpen && (
            <button
              onClick={() => setAllOpen(false)}
              className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface/40 px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary cursor-pointer"
            >
              <ChevronUp size={16} />
              접기
            </button>
          )}
          <div />
        </div>
        {/* 처음엔 유명 5개, 더보기 → 전체 모델 (유명 5개 다음에 나머지). 접기는 위 버튼으로 */}
        <SectionGrid
          items={allModels}
          preview={FEATURED.length}
          collapsible={false}
          open={allOpen}
          onOpenChange={setAllOpen}
        />
      </section>

      {groups.map((group) => (
        <section key={group.slug} id={sectionId(group.slug)} className="scroll-mt-20">
          <h2 className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-text-primary">
            {group.color && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />}
            {group.label}
            <span className="text-sm font-medium text-text-tertiary tabular-nums">{group.items.length}</span>
          </h2>
          <SectionGrid items={group.items} />
        </section>
      ))}
    </div>
  );
}

function SectionGrid({
  items,
  preview = PREVIEW,
  collapsible = true,
  open: openProp,
  onOpenChange,
}: {
  items: AIModel[];
  preview?: number;
  /** false면 펼친 뒤 아래 버튼을 없앤다 (맨 위 AI Models: 접기는 제목 옆 버튼으로) */
  collapsible?: boolean;
  /** 바깥에서 펼침 상태를 쥐고 싶을 때 (맨 위 AI Models) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOpenState(next));
  const hasMore = items.length > preview;
  const shown = open || !hasMore ? items : items.slice(0, preview);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {shown.map((model) => (
          <ModelCard key={model.slug} model={model} />
        ))}
      </div>
      {/* 묶음 아래 가운데, 카드 1.5칸 폭의 얇은 버튼 — 펼치면 "접기" (칸 수 2/3/4/5 → 폭 75/50/37.5/30%) */}
      {hasMore && (collapsible || !open) && (
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mx-auto flex w-3/4 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface/40 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary sm:w-1/2 md:w-[37.5%] lg:w-[30%] cursor-pointer"
        >
          {open ? <ChevronUp size={16} /> : <Plus size={16} />}
          {open ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}

export default function ModelsPage() {
  // useSearchParams는 Suspense 안에서 (정적 렌더 시 필요)
  return (
    <Suspense fallback={null}>
      <ModelsContent />
    </Suspense>
  );
}
