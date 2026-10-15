"use client";

import { useState, useEffect } from "react";

// 사이드바는 화면을 옮겨도 그대로 남아 있어서 처음 한 번만 받으면 숫자가 낡는다
// (크롤러가 기사를 넣어도 새로고침 전까지 옛 숫자). refreshKey가 바뀔 때(카테고리·페이지 이동)와
// 탭으로 돌아올 때 다시 받는다.
export function useCategoryCounts(refreshKey?: string): {
  counts: Record<string, number>;
  total: number;
  /** 카테고리별 가장 최근 수집 시각 (ISO). "all"은 전체 */
  latest: Record<string, string>;
  isLoading: boolean;
} {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [latest, setLatest] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchCounts() {
      try {
        const res = await fetch("/api/articles/counts", { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        setCounts(json.data);
        setTotal(json.total);
        setLatest({ ...(json.latest ?? {}), ...(json.latestAll ? { all: json.latestAll } : {}) });
      } catch {
        // Silently fail — counts are non-critical
      } finally {
        setIsLoading(false);
      }
    }

    fetchCounts();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCounts();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshKey]);

  return { counts, total, latest, isLoading };
}
