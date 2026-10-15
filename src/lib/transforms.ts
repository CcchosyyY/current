import type { Article, CategorySlug, AIModelSlug, HotType } from "./types";
import type { Locale } from "./i18n/config";
import { isRenderableImageUrl } from "./image-config";

// Shape returned by Supabase articles query with joined relations
export interface DBArticleRow {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source_url: string;
  source_name: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  read_time: number | null;
  view_count: number | null;
  is_trending: boolean | null;
  tags: string[] | null;
  hot_type: HotType | null;
  hot_reason: string | null;
  hot_event: string | null;
  // 한국어 번역 (scripts/lib/translate.mjs가 채움, 아직 안 됐으면 null)
  title_ko?: string | null;
  summary_ko?: string | null;
  content_ko?: string | null;
  categories: { name: string; slug: string; color: string } | null;
  ai_models: { name: string; slug: string; company: string; brand_color: string } | null;
}

export function dbArticleToArticle(row: DBArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    content: row.content ?? "",
    source: row.source_name,
    sourceUrl: row.source_url,
    // Crawled image_urls are untrusted: drop anything next/image would reject
    // (http://, video files, non-allowlisted hosts) so <Image> never throws and
    // crashes the page — the consumer just renders without an image instead.
    imageUrl: isRenderableImageUrl(row.image_url) ? row.image_url : null,
    category: (row.categories?.slug ?? "ai-ml") as CategorySlug,
    aiModel: (row.ai_models?.slug ?? null) as AIModelSlug | null,
    publishedAt: row.published_at ?? row.created_at,
    createdAt: row.created_at,
    readTime: row.read_time ?? 5,
    viewCount: row.view_count ?? 0,
    isTrending: row.is_trending ?? false,
    tags: row.tags ?? [],
    hotType: row.hot_type ?? null,
    hotReason: row.hot_reason ?? null,
    ko: row.title_ko
      ? { title: row.title_ko, summary: row.summary_ko ?? "", content: row.content_ko ?? "" }
      : null,
  };
}

/** 화면 언어에 맞는 제목·요약·본문으로 (한국어 번역이 없으면 원문 그대로) */
export function localizeArticle(a: Article, locale: Locale): Article {
  if (locale !== "ko" || !a.ko) return a;
  return {
    ...a,
    title: a.ko.title,
    summary: a.ko.summary || a.summary,
    content: a.ko.content || a.content,
  };
}
