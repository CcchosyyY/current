"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/types";
import { dbArticleToArticle } from "@/lib/transforms";
import type { DBArticleRow } from "@/lib/transforms";

interface UseArticlesParams {
  category?: string | null;
  search?: string;
  sort?: "latest" | "oldest";
  page?: number;
  limit?: number;
}

interface UseArticlesReturn {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useArticles(params: UseArticlesParams = {}): UseArticlesReturn {
  const { category, search, sort = "latest", page = 1, limit = 30 } = params;
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchArticles() {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (category && category !== "all") searchParams.set("category", category);
      if (search) searchParams.set("search", search);
      searchParams.set("sort", sort);
      searchParams.set("page", String(page));
      searchParams.set("limit", String(limit));

      try {
        const res = await fetch(`/api/articles?${searchParams}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch articles");

        const json = await res.json();
        const rows = Array.isArray(json.data) ? (json.data as DBArticleRow[]) : [];
        setArticles(rows.map(dbArticleToArticle));
        setPagination(
          json.pagination ?? { page, limit, total: 0, totalPages: 0 },
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();
    return () => controller.abort();
  }, [category, search, sort, page, limit]);

  return { articles, isLoading, error, pagination };
}
