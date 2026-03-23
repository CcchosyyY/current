import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/security";

// Rate limit: 60 requests per minute per IP
const articlesLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// Validate query parameters
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
    // Rate limiting
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

    let query = supabase
      .from("articles")
      .select(
        `
        *,
        categories(name, slug, color),
        ai_models(name, company, brand_color, logo_url)
      `,
        { count: "exact" },
      )
      .range(offset, offset + limit - 1);

    // Filter by category slug
    if (category) {
      query = query.eq("categories.slug", category);
    }

    // Filter by AI model id
    if (ai_model) {
      query = query.eq("ai_model_id", ai_model);
    }

    // Full-text search on title and summary
    // Security: escape Postgres LIKE wildcards (% and _) to prevent
    // pattern injection in ilike filters.
    if (search) {
      const escaped = search
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
      query = query.or(
        `title.ilike.%${escaped}%,summary.ilike.%${escaped}%`,
      );
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
