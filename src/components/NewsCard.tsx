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
import { HotBadge } from "@/components/HotSection";

interface NewsCardProps {
  article: Article;
  /** card: 그리드 카드 · list: 썸네일+요약 한 줄 (News) · feature: 날짜별 대표 기사 큰 카드 (News) */
  variant?: "list" | "card" | "feature";
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
    const ok = toggleBookmark(article.id, {
      onError: () => showToast("저장하지 못했어요. 잠시 후 다시 시도해 주세요", "error"),
    });
    if (!ok) {
      showToast("Sign in to save articles", "info");
      return;
    }
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

  const actions = (size: number, pad: string) => (
    <div className="flex items-center gap-1 shrink-0">
      <button
        aria-label={`Bookmark "${article.title}"`}
        className={`${pad} transition-colors ${bookmarked ? "text-primary" : "text-text-tertiary hover:text-primary"}`}
        onClick={handleBookmark}
      >
        <BookmarkIcon size={size} />
      </button>
      <button
        aria-label={`Share "${article.title}"`}
        className={`${pad} text-text-tertiary hover:text-primary transition-colors`}
        onClick={handleShare}
      >
        <Share2 size={size} />
      </button>
    </div>
  );

  // Feature — 날짜별 대표 기사: 왼쪽 큰 이미지, 오른쪽 제목·요약 (좁은 화면에선 위아래)
  if (variant === "feature") {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group grid overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-colors hover:border-border-strong md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-auto md:min-h-[220px]">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ArticlePlaceholder article={article} />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3 p-5 md:p-6">
          <div className="flex items-center gap-2">
            {article.hotType && <HotBadge type={article.hotType} />}
            {article.aiModel && (
              <span className="text-xs font-medium text-text-secondary">
                {AI_MODELS.find((m) => m.slug === article.aiModel)?.name}
              </span>
            )}
          </div>
          <h3 className="font-heading text-xl font-bold leading-snug text-text-primary line-clamp-3 transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-sm leading-relaxed text-text-secondary line-clamp-3">{article.summary}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <span className="flex min-w-0 items-center gap-2 text-sm text-text-tertiary">
              <ArticleLogo article={article} size={16} />
              <span className="truncate">{article.source}</span>
              <span>·</span>
              <span className="shrink-0">{getRelativeTime(article.publishedAt)}</span>
            </span>
            {actions(16, "p-1.5")}
          </div>
        </div>
      </Link>
    );
  }

  // List variant (default) — News 목록 한 줄: 썸네일 + 제목 + 요약 한 줄 + 출처·시간
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-bg-surface/50"
    >
      <div className="relative hidden h-[68px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-bg-surface sm:block">
        {article.imageUrl ? (
          <Image src={article.imageUrl} alt="" fill sizes="104px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ArticleLogo article={article} size={24} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-medium text-text-primary line-clamp-2 md:line-clamp-1 transition-colors group-hover:text-primary">
          {article.hotType && (
            <span className="mr-2 inline-block align-middle">
              <HotBadge type={article.hotType} />
            </span>
          )}
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-0.5 hidden text-sm text-text-secondary md:line-clamp-1">{article.summary}</p>
        )}
        <span className="mt-1 flex items-center gap-1.5 text-sm text-text-tertiary">
          <span className="sm:hidden">
            <ArticleLogo article={article} size={14} />
          </span>
          {article.source}
          <span>·</span>
          {getRelativeTime(article.publishedAt)}
        </span>
      </div>

      <div className="hidden sm:block">{actions(15, "p-1.5")}</div>
    </Link>
  );
}

const NewsCard = React.memo(NewsCardInner);
export default NewsCard;
