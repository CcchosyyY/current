import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: articles, error } = await supabase
      .from("articles")
      .select("category_id, categories(slug), created_at");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    let total = 0;
    // 카테고리별 가장 최근에 수집된 시각 — 사이드바 "새 글" 점 (마지막으로 본 시각과 비교)
    const latest: Record<string, string> = {};
    let latestAll = "";

    for (const article of articles ?? []) {
      total++;
      const slug = (article.categories as unknown as { slug: string } | null)?.slug;
      if (slug) {
        counts[slug] = (counts[slug] ?? 0) + 1;
        if (!latest[slug] || article.created_at > latest[slug]) latest[slug] = article.created_at;
      }
      if (article.created_at > latestAll) latestAll = article.created_at;
    }

    const response = NextResponse.json({ data: counts, total, latest, latestAll });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
