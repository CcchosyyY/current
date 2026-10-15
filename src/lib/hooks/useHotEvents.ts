"use client";

import { useState, useEffect, useMemo } from "react";
import type { HotEvent } from "@/lib/types";
import { dbArticleToArticle, localizeArticle } from "@/lib/transforms";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { HotEventRow } from "@/app/api/hot/route";

export function useHotEvents() {
  const [events, setEvents] = useState<HotEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchHot() {
      try {
        const res = await fetch("/api/hot", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch hot events");
        const json = await res.json();
        const rows = Array.isArray(json.data) ? (json.data as HotEventRow[]) : [];
        setEvents(
          rows.map((r) => ({
            key: r.key,
            type: r.type,
            reason: r.reason,
            firstAt: r.firstAt,
            lead: dbArticleToArticle(r.lead),
            articles: r.articles.map((a) => ({
              id: a.id,
              title: a.title,
              source: a.source_name,
              publishedAt: a.published_at,
            })),
          })),
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        // Hot은 보조 섹션 — 실패하면 조용히 숨긴다
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHot();
    return () => controller.abort();
  }, []);

  const { locale } = useLocale();
  const localized = useMemo(
    () => events.map((e) => ({ ...e, lead: localizeArticle(e.lead, locale) })),
    [events, locale],
  );
  return { events: localized, isLoading };
}
