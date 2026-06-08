import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/security";

const articlesLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

const ArticlesQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(["latest", "oldest"]).default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  ai_model: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!articlesLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const { searchParams } = request.nextUrl;

    const parsed = ArticlesQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      ai_model: searchParams.get("ai_model") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { category, search, sort, page, limit, ai_model } = parsed.data;
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Look up category UUID from slug for filtering
    let categoryId: string | null = null;
    if (category) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();
      if (catData) categoryId = catData.id;

      // A category was requested but does not exist → return an empty page
      // rather than silently falling through to an unfiltered (all-articles) query.
      if (!categoryId) {
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    // Resolve the AI model filter. Accept either a UUID (ai_model_id) or a slug
    // — the model detail modal only knows the slug, so we look it up the same way
    // categories are resolved above.
    let aiModelId: string | null = null;
    if (ai_model) {
      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (UUID_RE.test(ai_model)) {
        aiModelId = ai_model;
      } else {
        const { data: modelData } = await supabase
          .from("ai_models")
          .select("id")
          .eq("slug", ai_model)
          .single();
        if (modelData) aiModelId = modelData.id;

        // A model was requested but does not exist → return an empty page rather
        // than falling through to an unfiltered (all-articles) query.
        if (!aiModelId) {
          return NextResponse.json({
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
      }
    }

    let query = supabase
      .from("articles")
      .select(
        `
        *,
        categories(name, slug, color),
        ai_models(name, slug, company, brand_color, logo_url)
      `,
        { count: "exact" },
      )
      .range(offset, offset + limit - 1);

    // Filter by category UUID
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    // Filter by AI model (resolved from slug or UUID above)
    if (aiModelId) {
      query = query.eq("ai_model_id", aiModelId);
    }

    // Full-text search over the weighted `search_vector` column
    // (title > summary > content). `websearch` parses the term with
    // websearch_to_tsquery — it handles multi-word, "quoted phrases",
    // and -exclusions, and is passed as a bound parameter so there is no
    // injection surface (unlike the previous ilike + .or() string).
    if (search) {
      const trimmed = search.trim();
      if (trimmed) {
        query = query.textSearch("search_vector", trimmed, {
          type: "websearch",
          config: "english",
        });
      } else {
        // Whitespace-only search must not fall through to an unfiltered
        // (all-articles) query — return an empty page instead.
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    // Sort order
    query = query.order("published_at", {
      ascending: sort === "oldest",
      nullsFirst: false,
    });

    const { data, error, count } = await query;

    if (error) {
      console.error("Articles query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch articles" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (err) {
    console.error("Unexpected error in GET /api/articles:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
