import type { Article, CategorySlug, AIModelSlug } from "./types";

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
    imageUrl: row.image_url,
    category: (row.categories?.slug ?? "ai-ml") as CategorySlug,
    aiModel: (row.ai_models?.slug ?? null) as AIModelSlug | null,
    publishedAt: row.published_at ?? row.created_at,
    createdAt: row.created_at,
    readTime: row.read_time ?? 5,
    viewCount: row.view_count ?? 0,
    isTrending: row.is_trending ?? false,
    tags: row.tags ?? [],
  };
}
