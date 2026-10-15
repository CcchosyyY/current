"use client";

import { Bookmark, BookmarkCheck, Share2, ExternalLink } from "lucide-react";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { useShare } from "@/lib/hooks/useShare";
import { useToast } from "@/lib/hooks/useToast";
import { useMessages } from "@/lib/i18n/LocaleProvider";

interface ArticleActionsProps {
  articleId: string;
  articleTitle: string;
  sourceUrl: string;
}

export default function ArticleActions({
  articleId,
  articleTitle,
  sourceUrl,
}: ArticleActionsProps) {
  const m = useMessages();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { showToast } = useToast();
  const { share } = useShare({
    onSuccess: () => showToast(m.article.linkCopied, "success"),
  });

  const bookmarked = isBookmarked(articleId);

  function handleBookmark() {
    const ok = toggleBookmark(articleId, {
      onError: () => showToast(m.article.saveFailed, "error"),
    });
    if (!ok) {
      showToast(m.article.signInToSave, "info");
      return;
    }
    showToast(
      bookmarked ? m.article.removed : m.article.saved,
      "success"
    );
  }

  function handleShare() {
    const url = window.location.origin + "/article/" + articleId;
    share(articleTitle, url);
  }

  const BookmarkIcon = bookmarked ? BookmarkCheck : Bookmark;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-border-subtle">
      <button
        aria-label={m.article.saveArticle}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors cursor-pointer ${
          bookmarked
            ? "text-primary border-primary/30 bg-primary/10"
            : "text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary"
        }`}
        onClick={handleBookmark}
      >
        <BookmarkIcon size={16} aria-hidden="true" />
        {bookmarked ? m.article.savedCheck : m.article.saveArticle}
      </button>
      <button
        aria-label={m.article.shareArticle}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary border border-border-subtle rounded-lg hover:border-border-strong hover:text-text-primary transition-colors cursor-pointer"
        onClick={handleShare}
      >
        <Share2 size={16} aria-hidden="true" />
        {m.article.shareLabel}
      </button>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors ml-auto"
      >
        <ExternalLink size={16} />
        {m.article.originalSource}
      </a>
    </div>
  );
}
