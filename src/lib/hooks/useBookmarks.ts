"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "current_bookmarks";

interface UseBookmarksReturn {
  bookmarkedIds: Set<string>;
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  isLoading: boolean;
}

export function useBookmarks(): UseBookmarksReturn {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load bookmarks: from API if logged in, else from localStorage
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 로그인 시 북마크 fetch 전 로딩 표시 (정당한 데이터 동기화 effect)
      setIsLoading(true);
      fetch("/api/bookmarks")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            const ids = new Set<string>(
              json.data.map((b: { articles: { id: string } }) => b.articles.id)
            );
            setBookmarkedIds(ids);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // localStorage fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setBookmarkedIds(new Set(JSON.parse(stored) as string[]));
        }
      } catch {}
    }
  }, [user]);

  const toggleBookmark = useCallback(
    (articleId: string): void => {
      const wasBookmarked = bookmarkedIds.has(articleId);

      // Optimistic update
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(articleId);
        else next.add(articleId);
        return next;
      });

      if (user) {
        // API call
        const method = wasBookmarked ? "DELETE" : "POST";
        fetch("/api/bookmarks", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: articleId }),
        }).then((res) => {
          if (!res.ok && res.status !== 409) {
            // Revert on error
            setBookmarkedIds((prev) => {
              const reverted = new Set(prev);
              if (wasBookmarked) reverted.add(articleId);
              else reverted.delete(articleId);
              return reverted;
            });
          }
        });
      } else {
        // localStorage fallback
        setBookmarkedIds((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(prev)));
          } catch {}
          return prev;
        });
      }
    },
    [bookmarkedIds, user]
  );

  const isBookmarked = useCallback(
    (articleId: string): boolean => bookmarkedIds.has(articleId),
    [bookmarkedIds]
  );

  return { bookmarkedIds, toggleBookmark, isBookmarked, isLoading };
}
