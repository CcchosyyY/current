"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { dbArticleToArticle } from "@/lib/transforms";
import type { DBArticleRow } from "@/lib/transforms";
import type { Article } from "@/lib/types";
import { getRelativeTime } from "@/lib/utils";

interface ModelRelatedNewsProps {
  slug: string;
  accent: string;
  // Called when a news item is clicked, so the parent modal can close itself
  // before the route changes.
  onNavigate?: () => void;
  // When set, a "See all" link to the full model page is shown (only if there
  // is at least one article).
  seeAllHref?: string;
}

export default function ModelRelatedNews({
  slug,
  accent,
  onNavigate,
  seeAllHref,
}: ModelRelatedNewsProps) {
  // null = still loading, [] = loaded but empty (section hides itself).
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    let active = true;
    setArticles(null);
    fetch(`/api/articles?ai_model=${encodeURIComponent(slug)}&limit=2`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!active) return;
        const rows = (json?.data ?? []) as DBArticleRow[];
        setArticles(rows.map(dbArticleToArticle));
      })
      .catch(() => {
        if (active) setArticles([]);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // Hide the whole section when there's nothing to show.
  if (articles !== null && articles.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-text-tertiary">
          LATEST NEWS
        </p>
        {seeAllHref && articles && articles.length > 0 && (
          <Link
            href={seeAllHref}
            onClick={onNavigate}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold transition-colors"
            style={{ color: accent }}
          >
            See all <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="space-y-1">
        {articles === null
          ? Array.from({ length: 2 }).map((_, i) => <RowSkeleton key={i} />)
          : articles.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.id}`}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-bg-surface transition-colors"
              >
                <Thumb article={a} accent={accent} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                    {[a.source, getRelativeTime(a.publishedAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}

function Thumb({ article, accent }: { article: Article; accent: string }) {
  if (article.imageUrl) {
    return (
      <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-lg bg-bg-surface">
        <Image
          src={article.imageUrl}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
    );
  }
  // No usable image → brand-tinted initials placeholder.
  const initials = (article.source || article.title).slice(0, 2).toUpperCase();
  return (
    <div
      className="flex w-12 h-12 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
      style={{ backgroundColor: `${accent}24`, color: accent }}
    >
      {initials}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 -mx-2">
      <div className="w-12 h-12 shrink-0 rounded-lg bg-bg-surface animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-4/5 rounded bg-bg-surface animate-pulse" />
        <div className="h-2.5 w-1/3 rounded bg-bg-surface animate-pulse" />
      </div>
    </div>
  );
}
