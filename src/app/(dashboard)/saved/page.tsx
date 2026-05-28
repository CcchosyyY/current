"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import SavedGrid from "@/components/SavedGrid";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { dbArticleToArticle } from "@/lib/transforms";
import type { DBArticleRow } from "@/lib/transforms";
import type { Article } from "@/lib/types";

export default function SavedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { bookmarkedIds } = useBookmarks();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Fetch bookmarked articles from API
      fetch("/api/bookmarks?limit=50")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            setArticles(
              json.data.map((b: { articles: DBArticleRow }) =>
                dbArticleToArticle(b.articles)
              )
            );
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // No user — show articles from localStorage bookmarks via API
      if (bookmarkedIds.size === 0) {
        setArticles([]);
        setIsLoading(false);
        return;
      }
      // Fetch each bookmarked article individually
      Promise.all(
        Array.from(bookmarkedIds).map((id) =>
          fetch(`/api/articles/${id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((json) =>
              json?.data ? dbArticleToArticle(json.data as DBArticleRow) : null
            )
            .catch(() => null)
        )
      ).then((results) => {
        setArticles(results.filter(Boolean) as Article[]);
        setIsLoading(false);
      });
    }
  }, [user, authLoading, bookmarkedIds]);

  const count = articles.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-2">
          <Bookmark size={24} className="text-primary" />
          Saved Articles
        </h1>
        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
          {count} saved
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-bg-card border border-border-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mb-4">
            <Bookmark size={28} className="text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No saved articles yet
          </h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Bookmark articles you want to read later by clicking the save icon
            on any news card.
          </p>
        </div>
      ) : (
        <SavedGrid articles={articles} />
      )}
    </div>
  );
}
