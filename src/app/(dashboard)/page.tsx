"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Newspaper,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Cpu,
  MessageSquareQuote,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import NewsCard from "@/components/NewsCard";
import AIModelCard from "@/components/AIModelCard";
import ExpertCard from "@/components/ExpertCard";
import { AI_MODELS, AI_MODEL_CATEGORIES } from "@/lib/constants";
import { TODAYS_ARTICLES, EXPERT_INSIGHTS } from "@/lib/mock-data";
import type { AIModelFilter } from "@/lib/types";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const [newsOpen, setNewsOpen] = useState(true);
  const [modelFilter, setModelFilter] = useState<AIModelFilter>("all");

  // Filter articles by category from URL params
  const filteredArticles = useMemo(() => {
    if (!category || category === "ai-ml") return TODAYS_ARTICLES;
    return TODAYS_ARTICLES.filter((a) => a.category === category);
  }, [category]);

  const filteredModels =
    modelFilter === "all"
      ? AI_MODELS
      : AI_MODELS.filter((m) => m.category === modelFilter);

  return (
    <div className="space-y-8">
      {/* ── Stats bar ── */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-tertiary">Today:</span>
        <span className="font-medium text-text-primary">{filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}</span>
        <span className="text-text-tertiary">&middot;</span>
        <span className="font-medium text-text-primary">5 categories</span>
        <span className="text-text-tertiary">&middot;</span>
        <span className="text-text-tertiary">Updated 2m ago</span>
      </div>

      {/* ── Today's AI News ── */}
      <section>
        <button
          onClick={() => setNewsOpen(!newsOpen)}
          aria-expanded={newsOpen}
          aria-controls="todays-news"
          className="flex items-center gap-2 mb-4 group cursor-pointer"
        >
          <Newspaper size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-text-primary font-heading">
            Today&apos;s AI News
          </h2>
          {newsOpen ? (
            <ChevronUp
              size={18}
              className="text-text-tertiary group-hover:text-text-secondary transition-colors"
            />
          ) : (
            <ChevronDown
              size={18}
              className="text-text-tertiary group-hover:text-text-secondary transition-colors"
            />
          )}
        </button>

        <AnimatePresence initial={false}>
          {newsOpen && (
            <motion.div
              id="todays-news"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="bg-bg-card border border-border-subtle rounded-xl">
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-text-secondary">No articles found in this category</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {filteredArticles.map((article) => (
                      <div key={article.id} className="px-3">
                        <NewsCard article={article} variant="list" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-5 py-3 border-t border-border-subtle">
                  <Link
                    href="/trending"
                    className="text-sm text-primary hover:text-primary-light font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    View All News
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── AI Models ── */}
      <section>
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          {/* Header + category tabs */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Cpu size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-text-primary font-heading">
                AI Models
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-bg-surface rounded-lg p-1">
              {AI_MODEL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setModelFilter(cat.value as AIModelFilter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    modelFilter === cat.value
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responsive grid with layout animation */}
          <LayoutGroup>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              key={modelFilter}
            >
              {filteredModels.map((model) => (
                <motion.div key={model.slug} variants={staggerItem} layout>
                  <AIModelCard model={model} />
                </motion.div>
              ))}
            </motion.div>
          </LayoutGroup>

          {/* See all link */}
          <div className="mt-5 pt-4 border-t border-border-subtle">
            <Link
              href="#"
              className="text-sm text-primary hover:text-primary-light font-medium inline-flex items-center gap-1 transition-colors"
            >
              See All Models
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Expert Insights ── */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary font-heading mb-4 flex items-center gap-2">
          <MessageSquareQuote size={20} className="text-primary" />
          Expert Insights
        </h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {EXPERT_INSIGHTS.map((expert) => (
            <motion.div key={expert.id} variants={staggerItem}>
              <ExpertCard
                name={expert.name}
                handle={expert.handle}
                avatar={expert.avatar}
                quote={expert.quote}
                source={expert.source}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
