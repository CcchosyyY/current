"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, BookmarkCheck, Share2, Clock } from "lucide-react";
import type { Article } from "@/lib/types";
import { AI_MODELS } from "@/lib/constants";
import ArticleLogo from "@/components/ArticleLogo";
import { getRelativeTime } from "@/lib/utils";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { useShare } from "@/lib/hooks/useShare";
import { useToast } from "@/lib/hooks/useToast";

interface NewsCardProps {
  article: Article;
  variant?: "list" | "card";
}

// Branded fallback shown when a card article has no thumbnail. Fills the same
// 2:1 header block (using the linked AI model's accent color, or the app blue)
// so a card without an image keeps the same height and the title/body start at
// the same place as cards that do have one.
function ArticlePlaceholder({ article }: { article: Article }) {
  const model = article.aiModel
    ? AI_MODELS.find((m) => m.slug === article.aiModel)
    : null;
  const c1 = model?.color ?? "#3B82F6";
  const c2 = model?.colorSecondary ?? c1;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 shadow-sm">
        <ArticleLogo article={article} size={26} />
      </span>
      <span className="max-w-[80%] truncate text-xs font-medium text-white/90">
        {article.source}
      </span>
    </div>
  );
}

function NewsCardInner({ article, variant = "list" }: NewsCardProps) {
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { showToast } = useToast();
  const { share } = useShare({
    onSuccess: (msg) => showToast(msg, "success"),
  });

  const bookmarked = isBookmarked(article.id);

  function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(article.id);
    showToast(
      bookmarked ? "Removed from bookmarks" : "Saved to bookmarks",
      "success"
    );
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.origin + "/article/" + article.id;
    share(article.title, url);
  }

  const BookmarkIcon = bookmarked ? BookmarkCheck : Bookmark;
  const bookmarkClassName = bookmarked
    ? "p-1 text-primary transition-colors"
    : "p-1 hover:text-primary transition-colors text-text-tertiary";
  const bookmarkClassNameList = bookmarked
    ? "p-1.5 text-primary transition-colors"
    : "p-1.5 hover:text-primary transition-colors text-text-tertiary";

  if (variant === "card") {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group block bg-bg-card border border-border-subtle rounded-xl overflow-hidden hover:border-border-strong hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200"
      >
        {/* Image — falls back to a branded placeholder so every card keeps the
            same 2:1 header and the title/body line up across the grid. */}
        <div className="aspect-[2/1] w-full overflow-hidden relative">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <ArticlePlaceholder article={article} />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {article.category}
            </span>
            <span className="text-xs text-text-tertiary flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {getRelativeTime(article.publishedAt)}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
            {article.title}
          </h3>

          <p className="text-xs text-text-secondary line-clamp-2 mb-3">
            {article.summary}
          </p>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 min-w-0">
              <ArticleLogo article={article} size={14} />
              <span className="text-xs text-text-tertiary truncate">
                {article.source}
              </span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                aria-label={`Bookmark "${article.title}"`}
                className={bookmarkClassName}
                onClick={handleBookmark}
              >
                <BookmarkIcon size={14} />
              </button>
              <button
                aria-label={`Share "${article.title}"`}
                className="p-1 hover:text-primary transition-colors text-text-tertiary"
                onClick={handleShare}
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List variant (default) — compact row
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-bg-surface/50 transition-colors"
    >
      {/* Source logo (model → company → site fallback) */}
      <div className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
        <ArticleLogo article={article} size={20} />
      </div>

      {/* Title + source */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary line-clamp-2 md:truncate group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <span className="text-xs text-text-tertiary">{article.source}</span>
      </div>

      {/* Time */}
      <span className="text-xs text-text-tertiary shrink-0 hidden sm:block">
        {getRelativeTime(article.publishedAt)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 hidden sm:flex">
        <button
          aria-label={`Bookmark "${article.title}"`}
          className={bookmarkClassNameList}
          onClick={handleBookmark}
        >
          <BookmarkIcon size={14} />
        </button>
        <button
          aria-label={`Share "${article.title}"`}
          className="p-1.5 hover:text-primary transition-colors text-text-tertiary"
          onClick={handleShare}
        >
          <Share2 size={14} />
        </button>
      </div>
    </Link>
  );
}

const NewsCard = React.memo(NewsCardInner);
export default NewsCard;
