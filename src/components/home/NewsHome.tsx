"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Minus, ChevronUp, LayoutGrid, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AI_MODELS } from "@/lib/constants";
import { modelsByUsers } from "@/lib/popular-models";
import ModelCard from "@/components/ModelCard";
import { useArticles } from "@/lib/hooks/useArticles";
import ArticleLogo from "@/components/ArticleLogo";
import HotSection, { HotBadge } from "@/components/HotSection";
import { useLocale, useTimeAgo } from "@/lib/i18n/LocaleProvider";

// 처음 열었을 때 보여줄 기사 수 — 나머지는 컨테이너 내부 스크롤로 노출
const VISIBLE_NEWS_COUNT = 5;
// 한 번에 불러오는 기사 수 — 더 있으면 목록 아래 "더 보기"로 이만큼씩 늘린다
const NEWS_PAGE = 30;
// "Today's AI News"는 최근 24시간 안에 발행된 기사만
const TODAY_HOURS = 24;

// "전체"일 때 보여줄 유명한 모델 8개. 카테고리를 고르면 그 분야 사용자 많은 순(popular-models.ts).
const FEATURED_SLUGS = [
  "chatgpt",
  "claude",
  "gemini",
  "grok",
  "meta-ai",
  "copilot",
  "midjourney",
  "perplexity",
];

export default function NewsHome() {
  const { locale, m } = useLocale();
  const { agoShort } = useTimeAgo();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const [newsOpen, setNewsOpen] = useState(true);

  const newsListRef = useRef<HTMLDivElement>(null);
  const [newsMaxHeight, setNewsMaxHeight] = useState<number | null>(null);

  // 카테고리가 바뀌면 다시 처음 상태(NEWS_PAGE건, 5줄 높이)부터.
  // "더 보기"를 누르면 박스를 두 배(10줄)로 키우고, 새로 불러온 첫 기사로 스크롤한다.
  const [shown, setShown] = useState({ category, limit: NEWS_PAGE, expanded: false, from: 0 });
  const current = shown.category === category ? shown : { category, limit: NEWS_PAGE, expanded: false, from: 0 };
  const { articles, isLoading, pagination } = useArticles({ category, limit: current.limit, hours: TODAY_HOURS });
  const totalNews = pagination.total;
  // 보고 있던 카테고리 그대로 전체 기사(News)로
  const newsHref = category && category !== "all" ? `/news?category=${encodeURIComponent(category)}` : "/news";
  const visibleRows = current.expanded ? VISIBLE_NEWS_COUNT * 2 : VISIBLE_NEWS_COUNT;

  function showMore() {
    setShown({ category, limit: current.limit + NEWS_PAGE, expanded: true, from: articles.length });
  }

  // visibleRows번째 기사까지의 실제 높이를 측정해 스크롤 영역 높이로 고정
  useEffect(() => {
    const el = newsListRef.current;
    if (!el) return;
    const items = el.children;
    if (items.length > visibleRows) {
      const first = items[0] as HTMLElement;
      const last = items[visibleRows - 1] as HTMLElement;
      setNewsMaxHeight(last.offsetTop + last.offsetHeight - first.offsetTop);
    } else {
      setNewsMaxHeight(null);
    }
  }, [articles, isLoading, newsOpen, visibleRows]);

  // 더 불러온 뒤: 새로 들어온 첫 기사가 박스 맨 위에 오도록
  const scrolledFor = useRef(0);
  useEffect(() => {
    const el = newsListRef.current;
    const from = current.from;
    if (!el || from === 0 || scrolledFor.current === from || articles.length <= from) return;
    const target = el.children[from] as HTMLElement | undefined;
    if (!target) return;
    scrolledFor.current = from;
    el.scrollTo({ top: target.offsetTop - (el.children[0] as HTMLElement).offsetTop, behavior: "smooth" });
  }, [articles, current.from]);

  const categoryModels = useMemo(
    () => (category && category !== "all" ? modelsByUsers(category) : null),
    [category],
  );

  const featuredModels = useMemo(() => {
    if (categoryModels) return categoryModels;
    return FEATURED_SLUGS.map((slug) =>
      AI_MODELS.find((m) => m.slug === slug)
    ).filter(Boolean) as (typeof AI_MODELS)[number][];
  }, [categoryModels]);

  const modelRows = useMemo(() => {
    const rows: (typeof featuredModels)[] = [];
    for (let i = 0; i < featuredModels.length; i += 4) {
      rows.push(featuredModels.slice(i, i + 4));
    }
    return rows;
  }, [featuredModels]);

  return (
    <div className="space-y-6">
      {/* ── Hot ── */}
      <HotSection />

      {/* ── Today's AI News ── */}
      <section>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
              {m.home.todaysNews}
            </h2>
            <button
              onClick={() => setNewsOpen(!newsOpen)}
              aria-expanded={newsOpen}
              aria-controls="todays-news"
              aria-label={m.home.toggleNews}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-border-strong bg-bg-surface hover:bg-bg-surface/80 transition-colors cursor-pointer"
            >
              {newsOpen ? (
                <Minus size={14} className="text-text-secondary" />
              ) : (
                <ChevronUp size={14} className="text-text-secondary" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-tertiary">
              {new Date().toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                ...(locale === "ko" ? { weekday: "short" } : {}),
              })}
            </span>
            <Link
              href={newsHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors"
            >
              {m.home.allArticles}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {newsOpen && (
            <motion.div
              id="todays-news"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-2">
                {isLoading && articles.length === 0 ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-8 bg-bg-surface rounded animate-pulse" />
                    ))}
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary text-sm">
                      {m.home.noArticles24h}
                    </p>
                  </div>
                ) : (
                  <div
                    ref={newsListRef}
                    className="max-h-[200px] overflow-y-auto pr-1"
                    style={
                      newsMaxHeight ? { maxHeight: newsMaxHeight } : undefined
                    }
                  >
                    {articles.map((article, idx) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.id}`}
                        className={`group flex items-center gap-3 py-2 hover:bg-bg-surface/30 transition-colors rounded ${
                          idx < articles.length - 1
                            ? "border-b border-border-subtle"
                            : ""
                        }`}
                      >
                        <ArticleLogo article={article} size={18} />
                        {article.hotType && <HotBadge type={article.hotType} />}

                        <span className="flex-1 min-w-0 text-[11px] font-medium truncate group-hover:text-primary transition-colors">
                          {article.aiModel && (
                            <>
                              <span className="text-text-secondary">
                                {AI_MODELS.find((m) => m.slug === article.aiModel)?.name}
                              </span>
                              <span className="text-text-tertiary mx-2">|</span>
                            </>
                          )}
                          <span className="text-text-primary">{article.title}</span>
                        </span>

                        <span className="text-xs text-text-tertiary shrink-0">
                          {agoShort(article.publishedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {/* 아래: 24시간 안에 더 있으면 "더 보기", 그리고 항상 전체 기사(News)로 가는 길 */}
                {!(isLoading && articles.length === 0) && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {articles.length > 0 && totalNews > articles.length && (
                    <button
                      onClick={showMore}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface/40 px-4 py-1.5 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {isLoading ? m.home.loading : m.home.more}
                      <span className="tabular-nums text-text-tertiary">
                        {articles.length} / {totalNews}
                      </span>
                    </button>
                    )}
                    <Link
                      href={newsHref}
                      className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface/40 px-4 py-1.5 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors"
                    >
                      {m.home.pastArticles}
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── AI Models ── */}
      <section className="bg-bg-card border border-border-subtle rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <LayoutGrid size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary font-heading">
              {m.home.aiModels}
            </h2>
          </div>
        </div>

        {featuredModels.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-tertiary">
            {m.home.noModels}
          </div>
        ) : (
          <div className="space-y-3">
            {modelRows.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {row.map((model) => (
                  <ModelCard key={model.slug} model={model} />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border-subtle">
          <Link
            href="/models"
            className="text-sm text-primary hover:text-primary-light font-medium inline-flex items-center gap-1 transition-colors"
          >
            {m.home.seeAllModels}
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
