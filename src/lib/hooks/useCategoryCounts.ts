"use client";

import { useState, useEffect } from "react";

export function useCategoryCounts(): {
  counts: Record<string, number>;
  total: number;
  isLoading: boolean;
} {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/articles/counts");
        if (!res.ok) return;
        const json = await res.json();
        setCounts(json.data);
        setTotal(json.total);
      } catch {
        // Silently fail — counts are non-critical
      } finally {
        setIsLoading(false);
      }
    }

    fetchCounts();
  }, []);

  return { counts, total, isLoading };
}
