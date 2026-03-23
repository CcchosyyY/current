import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyOrigin, createRateLimiter, safeParseBody } from "@/lib/security";

// Rate limit: 30 bookmark mutations per minute per IP
const bookmarkLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

// ---- GET: list the current user's bookmarks ----
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!bookmarkLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("bookmarks")
      .select(
        `
        id,
        created_at,
        articles(
          id, title, summary, source_url, source_name, image_url, published_at,
          categories(name, slug, color),
          ai_models(name, company, brand_color)
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Bookmarks query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookmarks" },
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
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("Unexpected error in GET /api/bookmarks:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---- POST: bookmark an article ----
const BookmarkCreateSchema = z.object({
  article_id: z.string().uuid("Invalid article ID"),
});

export async function POST(request: NextRequest) {
  try {
    // Security: verify request origin to prevent CSRF attacks
    if (!verifyOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Security: rate limit bookmark creation
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!bookmarkLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await safeParseBody(request);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = BookmarkCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        article_id: parsed.data.article_id,
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation = already bookmarked
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Article already bookmarked" },
          { status: 409 },
        );
      }
      console.error("Bookmark insert error:", error);
      return NextResponse.json(
        { error: "Failed to create bookmark" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ data }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("Unexpected error in POST /api/bookmarks:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---- DELETE: remove a bookmark ----
const BookmarkDeleteSchema = z.object({
  article_id: z.string().uuid("Invalid article ID"),
});

export async function DELETE(request: NextRequest) {
  try {
    // Security: verify request origin to prevent CSRF attacks
    if (!verifyOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Security: rate limit bookmark deletion
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!bookmarkLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await safeParseBody(request);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = BookmarkDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("article_id", parsed.data.article_id);

    if (error) {
      console.error("Bookmark delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete bookmark" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("Unexpected error in DELETE /api/bookmarks:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
