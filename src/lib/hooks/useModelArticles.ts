"use client";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";
import { dbArticleToArticle } from "@/lib/transforms";
import type { DBArticleRow } from "@/lib/transforms";

interface UseModelArticlesReturn {
  articles: Article[];
  total: number;
  isLoading: boolean; // initial / model-change load
  loadingMore: boolean; // "load more" in progress
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Fetches articles for a single AI model (by slug) with "load more" pagination.
 * Page 1 replaces the list; later pages append. Pass `null` to disable fetching
 * (e.g. while the slug is unknown / invalid).
 */
export function useModelArticles(
  slug: string | null,
  pageSize = 20,
): UseModelArticlesReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset to a clean first page whenever the model changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- slug(prop) 변경 시 페이지네이션 상태 리셋 (입력 변화에 따른 정당한 재동기화)
    setArticles([]);
    setPage(1);
    setTotalPages(0);
    setTotal(0);
    setIsLoading(true);
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- slug 없을 때 로딩 종료 (정당한 effect)
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const isFirstPage = page === 1;
    if (isFirstPage) setIsLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({
      ai_model: slug,
      sort: "latest",
      page: String(page),
      limit: String(pageSize),
    });

    fetch(`/api/articles?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        const rows = Array.isArray(json.data) ? (json.data as DBArticleRow[]) : [];
        const mapped = rows.map(dbArticleToArticle);
        setArticles((prev) => (isFirstPage ? mapped : [...prev, ...mapped]));
        if (json.pagination) {
          setTotal(json.pagination.total ?? 0);
          setTotalPages(json.pagination.totalPages ?? 0);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        // Leave whatever we have; the page shows an empty state if nothing.
      })
      .finally(() => {
        setIsLoading(false);
        setLoadingMore(false);
      });

    return () => controller.abort();
  }, [slug, page, pageSize]);

  const hasMore = page < totalPages;
  const loadMore = () => {
    if (hasMore && !loadingMore && !isLoading) setPage((p) => p + 1);
  };

  return { articles, total, isLoading, loadingMore, hasMore, loadMore };
}
