import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/security";

// Rate limit: 60 requests per minute per IP
const modelsLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// Category enum must match AIModelCategory in types.ts
const ModelsQuerySchema = z.object({
  category: z
    .enum(["llm", "image", "code", "search", "multimodal", "open-source"])
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!modelsLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const { searchParams } = request.nextUrl;

    const parsed = ModelsQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from("ai_models")
      .select("*")
      .order("name", { ascending: true });

    if (parsed.data.category) {
      query = query.eq("category", parsed.data.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("AI models query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch AI models" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ data });
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response;
  } catch (err) {
    console.error("Unexpected error in GET /api/ai-models:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
