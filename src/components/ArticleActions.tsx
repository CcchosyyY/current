"use client";

import { Bookmark, BookmarkCheck, Share2, ExternalLink } from "lucide-react";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { useShare } from "@/lib/hooks/useShare";
import { useToast } from "@/lib/hooks/useToast";

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
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { showToast } = useToast();
  const { share } = useShare({
    onSuccess: () => showToast("Link copied to clipboard!", "success"),
  });

  const bookmarked = isBookmarked(articleId);

  function handleBookmark() {
    toggleBookmark(articleId);
    showToast(
      bookmarked ? "Removed from bookmarks" : "Saved to bookmarks",
      "success"
    );
  }

  function handleShare() {
    const url = window.location.origin + "/article/" + articleId;
    share(articleTitle, url);
  }

  const BookmarkIcon = bookmarked ? BookmarkCheck : Bookmark;

  return (
    <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border-subtle">
      <button
        aria-label="Save article"
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors cursor-pointer ${
          bookmarked
            ? "text-primary border-primary/30 bg-primary/10"
            : "text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary"
        }`}
        onClick={handleBookmark}
      >
        <BookmarkIcon size={16} aria-hidden="true" />
        {bookmarked ? "Saved \u2713" : "Save Article"}
      </button>
      <button
        aria-label="Share article"
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary border border-border-subtle rounded-lg hover:border-border-strong hover:text-text-primary transition-colors cursor-pointer"
        onClick={handleShare}
      >
        <Share2 size={16} aria-hidden="true" />
        Share
      </button>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors ml-auto"
      >
        <ExternalLink size={16} />
        Original Source
      </a>
    </div>
  );
}
