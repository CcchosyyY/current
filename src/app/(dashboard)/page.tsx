"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Minus, ChevronUp, LayoutGrid, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AI_MODELS } from "@/lib/constants";
import ModelCard from "@/components/ModelCard";
import { useArticles } from "@/lib/hooks/useArticles";
import ArticleLogo from "@/components/ArticleLogo";
import { getRelativeTimeShort, formatDate } from "@/lib/utils";
import type { AIModelFilter } from "@/lib/types";

const MODEL_TABS: { value: AIModelFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "llm", label: "LLM" },
  { value: "image", label: "Image" },
];

// 처음 열었을 때 보여줄 기사 수 — 나머지는 컨테이너 내부 스크롤로 노출
const VISIBLE_NEWS_COUNT = 5;

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

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const [newsOpen, setNewsOpen] = useState(true);
  const [modelFilter, setModelFilter] = useState<AIModelFilter>("all");

  const newsListRef = useRef<HTMLDivElement>(null);
  const [newsMaxHeight, setNewsMaxHeight] = useState<number | null>(null);

  const { articles, isLoading } = useArticles({ category });

  // 5번째 기사까지의 실제 높이를 측정해 스크롤 영역 높이로 고정
  useEffect(() => {
    const el = newsListRef.current;
    if (!el) return;
    const items = el.children;
    if (items.length > VISIBLE_NEWS_COUNT) {
      const first = items[0] as HTMLElement;
      const last = items[VISIBLE_NEWS_COUNT - 1] as HTMLElement;
      setNewsMaxHeight(last.offsetTop + last.offsetHeight - first.offsetTop);
    } else {
      setNewsMaxHeight(null);
    }
  }, [articles, isLoading, newsOpen]);

  const featuredModels = useMemo(() => {
    const featured = FEATURED_SLUGS.map((slug) =>
      AI_MODELS.find((m) => m.slug === slug)
    ).filter(Boolean) as (typeof AI_MODELS)[number][];

    if (modelFilter === "all") return featured;
    return featured.filter((m) => m.category === modelFilter);
  }, [modelFilter]);

  const modelRows = useMemo(() => {
    const rows: (typeof featuredModels)[] = [];
    for (let i = 0; i < featuredModels.length; i += 4) {
      rows.push(featuredModels.slice(i, i + 4));
    }
    return rows;
  }, [featuredModels]);

  return (
    <div className="space-y-6">
      {/* ── Today's AI News ── */}
      <section>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
              Today&apos;s AI News
            </h2>
            <button
              onClick={() => setNewsOpen(!newsOpen)}
              aria-expanded={newsOpen}
              aria-controls="todays-news"
              className="w-6 h-6 flex items-center justify-center rounded-md border border-border-strong bg-bg-surface hover:bg-bg-surface/80 transition-colors cursor-pointer"
            >
              {newsOpen ? (
                <Minus size={14} className="text-text-secondary" />
              ) : (
                <ChevronUp size={14} className="text-text-secondary" />
              )}
            </button>
          </div>
          <span className="text-sm text-text-tertiary">
            {formatDate(new Date())}
          </span>
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
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-8 bg-bg-surface rounded animate-pulse" />
                    ))}
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary text-sm">
                      No articles found in this category
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
                    {articles.map((article, idx) => {
                      return (
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
                          {getRelativeTimeShort(article.publishedAt)}
                        </span>
                      </Link>
                      );
                    })}
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
              AI Models
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {MODEL_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setModelFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  modelFilter === tab.value
                    ? "bg-primary text-white"
                    : "border border-border-strong text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {featuredModels.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-tertiary">
            No models in this category
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
            See All Models
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
