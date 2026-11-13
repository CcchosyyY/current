"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Newspaper, Search, X } from "lucide-react";
import NewsCard from "@/components/NewsCard";
import { CATEGORIES } from "@/lib/constants";
import { dbArticleToArticle, localizeArticle, type DBArticleRow } from "@/lib/transforms";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { categoryName } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { Article } from "@/lib/types";

// 전체 기사 — 홈의 "Today's AI News"(24시간)에서 넘어오는 곳.
// 카테고리는 사이드바(?category=), 검색어(?q=)와 기간(?period=)도 주소에 남겨 공유·뒤로가기가 된다.
// 아래로 내리면 PAGE건씩 이어서 불러온다.
// 기사를 보고 뒤로가기로 돌아오면 불러온 목록·스크롤 위치를 그대로 되살린다(sessionStorage).

const PAGE = 30;
const PERIODS = [
  { value: "all", hours: undefined },
  { value: "24h", hours: 24 },
  { value: "7d", hours: 24 * 7 },
  { value: "30d", hours: 24 * 30 },
] as const;
type Period = (typeof PERIODS)[number]["value"];

// ── 뒤로가기 복원 ─────────────────────────────────────────────────────────────
// 기사 상세로 갔다가 돌아오면 이 페이지가 새로 마운트돼 1페이지부터 다시 불러온다.
// 그래서 떠날 때 불러온 목록 + <main> 스크롤 위치를 조건(filterKey)별로 저장해 두고,
// 뒤로/앞으로 가기(popstate)로 돌아왔을 때만 되살린다. 사이드바로 새로 들어오면 처음부터.
const CACHE_PREFIX = "news-list:";
const CACHE_TTL_MS = 30 * 60_000;
type ListCache = { articles: Article[]; total: number; page: number; scrollTop: number; at: number };

let cameBack = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    cameBack = true;
  });
}

function readCache(key: string): ListCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    const c = raw ? (JSON.parse(raw) as ListCache) : null;
    return c && Date.now() - c.at < CACHE_TTL_MS && Array.isArray(c.articles) ? c : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, c: ListCache) {
  try {
    // 목록에 안 쓰는 본문은 빼서 저장 용량을 줄인다
    const articles = c.articles.map((a) => ({ ...a, content: "", ko: a.ko ? { ...a.ko, content: "" } : a.ko }));
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...c, articles }));
  } catch {
    // 용량 초과·저장 불가 — 복원만 못 할 뿐
  }
}

// ── 날짜별 묶음 (한국 시간 기준) ──────────────────────────────────────────────
const kstDay = (iso: string | null | undefined) => {
  const t = Date.parse(iso ?? "");
  return new Date((Number.isNaN(t) ? Date.now() : t) + 9 * 3600_000).toISOString().slice(0, 10);
};
function dayLabels(key: string, m: Messages) {
  const today = kstDay(new Date().toISOString());
  const yesterday = kstDay(new Date(Date.now() - 24 * 3600_000).toISOString());
  const [, month, day] = key.split("-").map(Number);
  const date = m.news.dayDate(month, day, new Date(`${key}T00:00:00Z`).getUTCDay());
  if (key === today) return { label: m.news.today, date };
  if (key === yesterday) return { label: m.news.yesterday, date };
  return { label: date, date: "" };
}

// 그날의 대표 기사: Hot(이미지 있음) → Hot → 모델 기사(이미지 있음) → 이미지 있는 기사 → 가장 최근
function pickFeature(items: Article[]): Article {
  return (
    items.find((a) => a.hotType && a.imageUrl) ??
    items.find((a) => a.hotType) ??
    items.find((a) => a.aiModel && a.imageUrl) ??
    items.find((a) => a.imageUrl) ??
    items[0]
  );
}

function groupByDay(articles: Article[], m: Messages) {
  const map = new Map<string, Article[]>();
  for (const a of articles) {
    const key = kstDay(a.publishedAt || a.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return [...map.entries()].map(([key, items]) => {
    const feature = pickFeature(items);
    return { key, ...dayLabels(key, m), items, feature, rest: items.filter((a) => a !== feature) };
  });
}

function NewsContent() {
  const router = useRouter();
  const { locale, m } = useLocale();
  const params = useSearchParams();
  const category = params.get("category") || "all";
  const q = params.get("q") ?? "";
  const period = (PERIODS.find((p) => p.value === params.get("period"))?.value ?? "all") as Period;
  const hours = PERIODS.find((p) => p.value === period)?.hours;

  const filterKey = `${category}|${q}|${period}`;
  // 뒤로가기로 돌아온 경우에만 저장해 둔 목록으로 시작 (첫 렌더에서 한 번만 정한다)
  const [restored] = useState(() => {
    const back = cameBack;
    cameBack = false;
    return back ? readCache(filterKey) : null;
  });
  const [articles, setArticles] = useState<Article[]>(restored?.articles ?? []);
  const [total, setTotal] = useState(restored?.total ?? 0);
  const [page, setPage] = useState(restored?.page ?? 1);
  const [loading, setLoading] = useState(!restored);
  const [draft, setDraft] = useState(q);
  const sentinel = useRef<HTMLDivElement>(null);
  const [loadedKey, setLoadedKey] = useState(filterKey);
  const skipFetch = useRef(!!restored); // 되살린 페이지는 다시 받지 않는다

  // 조건이 바뀌면 처음부터 (렌더 중에 리셋 — effect보다 깜빡임이 적다)
  if (loadedKey !== filterKey) {
    setLoadedKey(filterKey);
    setArticles([]);
    setTotal(0);
    setPage(1);
    setLoading(true);
    setDraft(q);
  }

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const ctrl = new AbortController();
    const sp = new URLSearchParams({ page: String(page), limit: String(PAGE), sort: "latest" });
    if (category !== "all") sp.set("category", category);
    if (q) sp.set("search", q);
    if (hours) sp.set("hours", String(hours));
    fetch(`/api/articles?${sp}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const rows = Array.isArray(json?.data) ? (json.data as DBArticleRow[]).map(dbArticleToArticle) : [];
        setArticles((prev) => {
          const seen = new Set(prev.map((a) => a.id));
          return page === 1 ? rows : [...prev, ...rows.filter((a) => !seen.has(a.id))];
        });
        setTotal(json?.pagination?.total ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setLoading(false);
      });
    return () => ctrl.abort();
  }, [category, q, hours, page]);

  // 되살린 스크롤 위치로 이동 (목록이 그려진 뒤)
  useEffect(() => {
    const main = sentinel.current?.closest("main");
    if (restored && main) main.scrollTop = restored.scrollTop;
  }, [restored]);

  // 떠날 때(기사 클릭 등) 지금 목록과 스크롤 위치를 저장. 최신 값은 ref로 들고 있다.
  // layout effect 정리 함수는 DOM이 빠지기 전에 돈다 — 그 뒤엔 <main>이 짧아져 scrollTop이 0으로 눌린다.
  const snapshot = useRef({ filterKey, articles, total, page, loading });
  useEffect(() => {
    snapshot.current = { filterKey, articles, total, page, loading };
  });
  useLayoutEffect(() => {
    const main = sentinel.current?.closest("main");
    return () => {
      const s = snapshot.current;
      if (!main || s.articles.length === 0) return;
      writeCache(s.filterKey, {
        articles: s.articles,
        total: s.total,
        // 다음 페이지를 받는 중이면 그 페이지는 아직 없으니 한 페이지 전으로 저장
        page: s.loading ? Math.max(1, s.page - 1) : s.page,
        scrollTop: main.scrollTop,
        at: Date.now(),
      });
    };
  }, []);

  // 목록 끝이 보이면 다음 페이지
  const hasMore = articles.length < total;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setLoading(true);
        setPage((p) => p + 1);
      }
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading]);

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.replace(`/news${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  }

  const cat = category === "all" ? null : CATEGORIES.find((c) => c.slug === category);
  const catLabel = cat ? categoryName(cat, locale) : null;
  // 화면 언어에 맞춰 제목·요약 (언어를 바꾸면 다시 받지 않고 바로 바뀐다)
  const localized = useMemo(() => articles.map((a) => localizeArticle(a, locale)), [articles, locale]);
  const days = useMemo(() => groupByDay(localized, m), [localized, m]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2 font-heading text-[24px] font-bold text-text-primary">
          <Newspaper size={24} className="text-primary" />
          {m.news.title}
          {catLabel && <span className="text-lg font-semibold text-text-secondary">· {catLabel}</span>}
          <span className="text-sm font-medium tabular-nums text-text-tertiary">{loading && page === 1 ? "" : total}</span>
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* 검색: Enter로 적용 (?q=) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", draft.trim() || null);
            }}
            className="flex h-[26px] items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface/40 px-3 focus-within:border-primary/60"
          >
            <Search size={13} className="text-text-tertiary" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={m.news.search}
              maxLength={200}
              className="w-52 bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-tertiary"
            />
            {q && (
              <button type="button" onClick={() => setParam("q", null)} aria-label={m.news.clearSearch} className="text-text-tertiary hover:text-text-primary cursor-pointer">
                <X size={12} />
              </button>
            )}
          </form>

          {/* 기간 */}
          <div className="flex h-[26px] items-center rounded-lg border border-border-subtle p-0.5" role="group" aria-label={m.news.period}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setParam("period", p.value === "all" ? null : p.value)}
                aria-pressed={period === p.value}
                className={`flex h-full items-center rounded-md px-3 text-[12px] font-medium transition-colors cursor-pointer ${
                  period === p.value ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m.news.periods[p.value]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="space-y-3">
          <div className="h-56 animate-pulse rounded-2xl bg-bg-surface" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="rounded-2xl border border-border-subtle bg-bg-card py-16 text-center text-sm text-text-secondary">
          {q ? m.news.noMatch(q) : m.news.noResults}
        </p>
      ) : (
        <div className="space-y-12">
          {days.map((day, i) => {
            // 마지막 날은 아직 다 안 불러왔을 수 있어 개수를 숨긴다
            const complete = i < days.length - 1 || !hasMore;
            return (
              <section key={day.key}>
                {/* 날짜 제목 — 스크롤하는 동안 위에 붙어 있다. <main>의 위쪽 여백(py-4/6/8)만큼 끌어올려
                    맨 위 틈으로 기사가 비치지 않게 */}
                <h2 className="sticky -top-4 z-10 -mx-2 mb-4 flex items-baseline gap-3 bg-bg-page/95 px-2 pb-3 pt-7 backdrop-blur md:-top-6 md:pt-9 lg:-top-8 lg:pt-11">
                  <span className="font-heading text-xl font-bold text-text-primary">{day.label}</span>
                  <span className="text-sm text-text-tertiary">{day.date}</span>
                  {complete && <span className="ml-auto text-sm tabular-nums text-text-tertiary">{m.news.count(day.items.length)}</span>}
                </h2>
                <NewsCard article={day.feature} variant="feature" />
                {day.rest.length > 0 && (
                  <div className="mt-3 divide-y divide-border-subtle">
                    {day.rest.map((a) => (
                      <NewsCard key={a.id} article={a} variant="list" />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div ref={sentinel} />
      {loading && page > 1 && (
        <div className="flex justify-center py-4 text-text-tertiary">
          <Loader2 size={18} className="animate-spin" />
        </div>
      )}
      {!loading && articles.length > 0 && !hasMore && (
        <p className="py-4 text-center text-xs text-text-tertiary">{m.news.allSeen(total)}</p>
      )}
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={null}>
      <NewsContent />
    </Suspense>
  );
}
