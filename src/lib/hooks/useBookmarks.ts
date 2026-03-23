"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "current_bookmarks";

interface UseBookmarksReturn {
  bookmarkedIds: Set<string>;
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Restore from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        setBookmarkedIds(new Set(parsed));
      }
    } catch {
      // Ignore parse errors or missing storage
    }
  }, []);

  // Persist to localStorage whenever bookmarkedIds changes
  useEffect(() => {
    // Skip the initial empty set before hydration
    if (bookmarkedIds.size === 0) {
      // Only clear storage if it was explicitly emptied (not initial mount)
      // We check localStorage to distinguish
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed: string[] = JSON.parse(stored);
        if (parsed.length === 0) return;
        // If storage has items but state is empty, this is initial mount — skip
        return;
      } catch {
        return;
      }
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(bookmarkedIds))
      );
    } catch {
      // Storage full or unavailable
    }
  }, [bookmarkedIds]);

  const toggleBookmark = useCallback((articleId: string): void => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      // Persist immediately for the removal-to-zero edge case
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Storage full or unavailable
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (articleId: string): boolean => {
      return bookmarkedIds.has(articleId);
    },
    [bookmarkedIds]
  );

  return { bookmarkedIds, toggleBookmark, isBookmarked };
}
