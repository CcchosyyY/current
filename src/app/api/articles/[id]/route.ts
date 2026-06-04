import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/security";

const articleLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!articleLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const parsed = ParamsSchema.safeParse(await params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        categories(name, slug, color),
        ai_models(name, slug, company, brand_color, logo_url)
      `)
      .eq("id", parsed.data.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
