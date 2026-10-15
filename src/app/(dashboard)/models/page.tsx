"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronUp, LayoutGrid, Plus } from "lucide-react";
import { AI_MODELS, CATEGORIES } from "@/lib/constants";
import type { AIModel } from "@/lib/types";
import ModelCard from "@/components/ModelCard";
import { MODEL_SECTIONS, SECTION_FALLBACK } from "@/lib/model-sections";
import { setModelsSection } from "@/lib/hooks/useModelsSection";

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
    // 사이드바(CATEGORIES)와 같은 순서로
    const order = (slug: string) => {
      const i = CATEGORIES.findIndex((c) => c.slug === slug);
      return i < 0 ? CATEGORIES.length : i;
    };
    const sections = [...MODEL_SECTIONS].sort((a, b) => order(a.slug) - order(b.slug));
    const list = sections.map((s) => {
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

  // 이 페이지는 window가 아니라 레이아웃의 <main>이 스크롤된다
  const rootRef = useRef<HTMLDivElement>(null);
  const scroller = () => rootRef.current?.closest("main") ?? null;
  // 스크롤 감지가 바꾼 ?category= 는 다시 스크롤하지 않는다 (그 값을 기억)
  const fromSpy = useRef<string | null>(null);
  // 사이드바를 눌러 부드럽게 이동하는 동안엔 감지를 멈춘다 (지나가는 묶음마다 강조가 깜빡이지 않게)
  const lockUntil = useRef(0);

  // ?category= 가 바뀌면 그 묶음으로 스크롤 (사이드바 클릭·주소로 들어오기).
  // 사이드바 링크는 Models에서 scroll={false} — 맨 위로 튀었다가 다시 내려오지 않게.
  useEffect(() => {
    if (!category) return;
    if (fromSpy.current === category) {
      fromSpy.current = null;
      return;
    }
    const main = scroller();
    const target = SECTION_FALLBACK[category] ?? category;
    const el = target === "top" ? null : document.getElementById(sectionId(target));
    if (!main || (target !== "top" && !el)) return;
    setModelsSection(category); // 누른 카테고리를 바로 강조 (글쓰기처럼 묶음이 없는 것도 그대로)
    lockUntil.current = Date.now() + 1200;
    const unlock = () => (lockUntil.current = 0);
    main.addEventListener("scrollend", unlock, { once: true });
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else main.scrollTo({ top: 0, behavior: "smooth" });
    return () => main.removeEventListener("scrollend", unlock);
  }, [category]);

  // 스크롤하면 지금 보고 있는 묶음을 ?category= 에 조용히 반영 → 사이드바 강조가 따라온다
  useEffect(() => {
    const main = scroller();
    if (!main) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (Date.now() < lockUntil.current) return;
      // 화면 가운데 선을 넘어온 마지막 묶음 = 지금 보는 묶음 (묶음이 화면 중간쯤 왔을 때 바뀐다)
      const line = main.getBoundingClientRect().top + main.clientHeight / 2;
      let current = "all";
      for (const g of groups) {
        const el = document.getElementById(sectionId(g.slug));
        if (el && el.getBoundingClientRect().top <= line) current = g.slug;
      }
      // 맨 아래까지 내렸으면 마지막 묶음
      if (main.scrollTop + main.clientHeight >= main.scrollHeight - 4) current = groups[groups.length - 1]?.slug ?? current;
      if (current === "etc") return; // 사이드바에 없는 묶음

      setModelsSection(current); // 사이드바 강조
      // 주소도 맞춰 둔다 (새로고침·공유 시 그 묶음에서 열리게). 이 값으로는 다시 스크롤하지 않는다
      const now = new URLSearchParams(window.location.search).get("category") || "all";
      const nowShown = SECTION_FALLBACK[now] === "top" ? "all" : (SECTION_FALLBACK[now] ?? now);
      if (nowShown === current) return;
      fromSpy.current = current === "all" ? null : current;
      window.history.replaceState(window.history.state, "", current === "all" ? "/models" : `/models?category=${current}`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    compute(); // 들어왔을 때 위치 기준으로 한 번
    return () => {
      main.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      setModelsSection(null); // Models를 떠나면 사이드바는 다시 주소 기준
    };
  }, [groups]);

  return (
    <div ref={rootRef} className="space-y-20">
      {/* 맨 위: 제일 유명한 모델 5개 (사이드바 "전체"를 누르면 여기로) */}
      <section>
        {/* 제목 왼쪽 · 접기 버튼 가운데 (3칸: 제목 | 버튼 | 빈칸) */}
        <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <h1 className="flex items-center gap-2 font-heading text-[24px] font-bold text-text-primary">
            <LayoutGrid size={24} className="text-primary" />
            AI Models
            <span className="text-sm font-medium text-text-tertiary tabular-nums">{AI_MODELS.length}</span>
          </h1>
          {/* 이 묶음만 특별히: 펼쳤을 때 접기 버튼을 위에도 — 79개 아래까지 내려가지 않고 접게 */}
          {/* 버튼 자리는 늘 차지하고 펼쳤을 때만 보이게 — 나타날 때 제목 줄 높이가 바뀌어
              아래 내용이 밀려 내려가지 않도록 */}
          <button
            onClick={() => setAllOpen(false)}
            aria-hidden={!allOpen}
            tabIndex={allOpen ? 0 : -1}
            className={`flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface/40 px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary cursor-pointer ${
              allOpen ? "" : "invisible"
            }`}
          >
            <ChevronUp size={16} />
            접기
          </button>
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
    <div className="space-y-[44px]">
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
