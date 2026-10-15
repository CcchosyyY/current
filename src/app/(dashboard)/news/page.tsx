"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Newspaper, Search, X } from "lucide-react";
import NewsCard from "@/components/NewsCard";
import { CATEGORIES } from "@/lib/constants";
import { dbArticleToArticle, type DBArticleRow } from "@/lib/transforms";
import type { Article } from "@/lib/types";

// 전체 기사 — 홈의 "Today's AI News"(24시간)에서 넘어오는 곳.
// 카테고리는 사이드바(?category=), 검색어(?q=)와 기간(?period=)도 주소에 남겨 공유·뒤로가기가 된다.
// 아래로 내리면 PAGE건씩 이어서 불러온다.

const PAGE = 30;
const PERIODS = [
  { value: "all", label: "전체", hours: undefined },
  { value: "24h", label: "24시간", hours: 24 },
  { value: "7d", label: "7일", hours: 24 * 7 },
  { value: "30d", label: "30일", hours: 24 * 30 },
] as const;
type Period = (typeof PERIODS)[number]["value"];

function NewsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") || "all";
  const q = params.get("q") ?? "";
  const period = (PERIODS.find((p) => p.value === params.get("period"))?.value ?? "all") as Period;
  const hours = PERIODS.find((p) => p.value === period)?.hours;

  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(q);
  const sentinel = useRef<HTMLDivElement>(null);
  const filterKey = `${category}|${q}|${period}`;
  const [loadedKey, setLoadedKey] = useState(filterKey);

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

  const categoryName = category === "all" ? null : CATEGORIES.find((c) => c.slug === category)?.name;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-text-primary">
          <Newspaper size={24} className="text-primary" />
          News
          {categoryName && <span className="text-lg font-semibold text-text-secondary">· {categoryName}</span>}
          <span className="text-sm font-medium tabular-nums text-text-tertiary">{loading && page === 1 ? "" : total}</span>
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* 검색: Enter로 적용 (?q=) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", draft.trim() || null);
            }}
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface/40 px-3 py-1.5 focus-within:border-primary/60"
          >
            <Search size={14} className="text-text-tertiary" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="기사 검색 (영문)"
              maxLength={200}
              className="w-44 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
            {q && (
              <button type="button" onClick={() => setParam("q", null)} aria-label="검색 지우기" className="text-text-tertiary hover:text-text-primary cursor-pointer">
                <X size={14} />
              </button>
            )}
          </form>

          {/* 기간 */}
          <div className="flex rounded-lg border border-border-subtle p-0.5" role="group" aria-label="기간">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setParam("period", p.value === "all" ? null : p.value)}
                aria-pressed={period === p.value}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  period === p.value ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-3 py-2">
        {loading && page === 1 ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-bg-surface" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-secondary">
            {q ? `"${q}"에 맞는 기사가 없어요` : "조건에 맞는 기사가 없어요"}
          </p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {articles.map((a) => (
              <NewsCard key={a.id} article={a} variant="list" />
            ))}
          </div>
        )}

        <div ref={sentinel} />
        {loading && page > 1 && (
          <div className="flex justify-center py-4 text-text-tertiary">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
        {!loading && articles.length > 0 && !hasMore && (
          <p className="py-4 text-center text-xs text-text-tertiary">모든 기사를 다 봤어요 · {total}건</p>
        )}
      </div>
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
