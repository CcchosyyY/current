import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: articles, error } = await supabase
      .from("articles")
      .select("category_id, categories(slug)");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    let total = 0;

    for (const article of articles ?? []) {
      total++;
      const slug = (article.categories as unknown as { slug: string } | null)?.slug;
      if (slug) {
        counts[slug] = (counts[slug] ?? 0) + 1;
      }
    }

    const response = NextResponse.json({ data: counts, total });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
