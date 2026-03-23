"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { TRENDING_ARTICLES, MOCK_NOW, getRelativeTime } from "@/lib/mock-data";
import type { TrendingPeriod } from "@/lib/types";

const PERIOD_OPTIONS: { value: TrendingPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "up")
    return <ArrowUpRight size={16} className="text-success" />;
  if (trend === "down")
    return <ArrowDownRight size={16} className="text-error" />;
  return <Minus size={14} className="text-text-tertiary" />;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function TrendingPage() {
  const [period, setPeriod] = useState<TrendingPeriod>("today");

  // Filter by period then sort by view count descending
  const sorted = useMemo(() => {
    const nowMs = MOCK_NOW.getTime();
    const hourMs = 1000 * 60 * 60;

    const maxAgeMs =
      period === "today"
        ? 24 * hourMs
        : period === "this-week"
          ? 7 * 24 * hourMs
          : 30 * 24 * hourMs;

    return TRENDING_ARTICLES
      .filter((a) => nowMs - new Date(a.publishedAt).getTime() <= maxAgeMs)
      .sort((a, b) => b.viewCount - a.viewCount);
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header + period tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-2">
          <TrendingUp size={24} className="text-primary" />
          Trending Now
        </h1>

        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                period === opt.value
                  ? "bg-primary text-white"
                  : "border border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ranked list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary">No trending articles for this period</p>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          key={period}
        >
          {sorted.map((article, index) => (
            <motion.div key={article.id} variants={staggerItem}>
              <Link
                href={`/article/${article.id}`}
                className="flex items-center gap-3 sm:gap-5 bg-bg-card border border-border-subtle rounded-xl px-4 sm:px-6 py-4 hover:border-border-strong hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Rank */}
                <span className="text-2xl font-bold font-heading text-primary w-8 text-center shrink-0">
                  {index + 1}
                </span>

                {/* Thumbnail - hidden on mobile */}
                {article.imageUrl && (
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-bg-surface relative hidden sm:block">
                    <Image
                      src={article.imageUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {getRelativeTime(article.publishedAt)}
                    </span>
                    <span className="text-xs text-text-tertiary flex items-center gap-1">
                      <Eye size={12} />
                      {formatViews(article.viewCount)} views
                    </span>
                  </div>
                </div>

                {/* Trend arrow */}
                <div className="shrink-0">
                  <TrendIcon trend={article.isTrending ? "up" : "stable"} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
