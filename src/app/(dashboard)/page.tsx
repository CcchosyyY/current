"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Minus, ChevronUp, LayoutGrid, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AI_MODELS } from "@/lib/constants";
import { useArticles } from "@/lib/hooks/useArticles";
import { getRelativeTimeShort, formatDate } from "@/lib/utils";
import type { AIModelFilter } from "@/lib/types";

const MODEL_TABS: { value: AIModelFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "llm", label: "LLM" },
  { value: "image", label: "Image" },
];

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

  const { articles, isLoading } = useArticles({ category });

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
                  <div>
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
                        {article.aiModel && (
                          <Image
                            src={`/icons/models/${article.aiModel}.svg`}
                            alt={article.aiModel}
                            width={18}
                            height={18}
                            className="shrink-0"
                          />
                        )}

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
                    ))}
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

        <div className="space-y-3">
          {modelRows.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {row.map((model) => (
                <a
                  key={model.slug}
                  href={model.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer transition-transform duration-300 hover:scale-105"
                >
                  <div
                    className="absolute inset-0 transition-all duration-300 group-hover:brightness-125"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in srgb, ${model.color} 20%, #08080E), color-mix(in srgb, ${model.colorSecondary || model.color} 12%, #08080E))`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pb-6">
                    <Image
                      src={`/icons/models/${model.slug}.svg`}
                      alt={model.name}
                      width={40}
                      height={40}
                      className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm font-semibold leading-tight">
                      {model.name}
                    </p>
                    <p className="text-white/70 text-[10px]">
                      {model.company}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle">
          <Link
            href="#"
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
