import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/security";
import { ARTICLE_SELECT } from "@/lib/transforms";

const articlesLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// 한국어로 쓴 이름 → 번역문에 실제로 남는 영어 이름. 번역이 이 이름들을 영어로 고쳐 두므로
// (scripts/lib/translate.mjs NAME_FIXES — 둘을 같이 고칠 것) "클로드"로 찾으면 아무것도 안 걸린다.
const PHRASE_ALIASES: [string, string][] = [
  ["클로드 코드", "Claude Code"], ["오픈 AI", "OpenAI"], ["허깅 페이스", "Hugging Face"],
];
const NAME_ALIASES: [string, string][] = [
  ["클로드", "Claude"], ["앤스로픽", "Anthropic"], ["앤트로픽", "Anthropic"], ["엔트로픽", "Anthropic"],
  ["오픈에이아이", "OpenAI"], ["오픈AI", "OpenAI"], ["챗GPT", "ChatGPT"], ["챗지피티", "ChatGPT"],
  ["제미나이", "Gemini"], ["제미니", "Gemini"], ["그록", "Grok"], ["코파일럿", "Copilot"],
  ["미드저니", "Midjourney"], ["퍼플렉시티", "Perplexity"], ["딥시크", "DeepSeek"], ["딥마인드", "DeepMind"],
  ["허깅페이스", "Hugging Face"], ["미스트랄", "Mistral"], ["노트북LM", "NotebookLM"],
  ["일레븐랩스", "ElevenLabs"], ["런웨이", "Runway"], ["엑스에이아이", "xAI"],
];

// 검색어 → 단어마다 ILIKE '%단어%' 패턴 (모든 단어가 들어 있어야 걸린다).
// 이름은 단어 앞부분으로 맞춘다 — "클로드가"도 Claude로 (조사는 버린다).
function searchPatterns(search: string): string[] {
  let text = search;
  for (const [from, to] of PHRASE_ALIASES) text = text.split(from).join(to);
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((w) => NAME_ALIASES.find(([from]) => w.startsWith(from))?.[1] ?? w)
    .map((w) => `%${w.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
}

const ArticlesQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(["latest", "oldest"]).default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  ai_model: z.string().optional(),
  // 최근 N시간 안에 발행된 기사만 (홈 "Today's AI News"는 24)
  hours: z.coerce.number().int().min(1).max(24 * 90).optional(),
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
      hours: searchParams.get("hours") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { category, search, sort, page, limit, ai_model, hours } = parsed.data;
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
        ARTICLE_SELECT,
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

    // Substring search over `search_text` (original + Korean translation,
    // pg_trgm index). The English-only full-text `search_vector` missed every
    // Korean term and hyphenated names like "GPT-5". Each word is its own
    // ilike filter (AND), sent as a value — no .or() string to inject into.
    const patterns = search ? searchPatterns(search) : [];
    if (search) {
      if (patterns.length > 0) {
        for (const p of patterns) query = query.ilike("search_text", p);
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
    if (hours) {
      query = query.gte("published_at", new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());
    }

    query = query.order("published_at", {
      ascending: sort === "oldest",
      nullsFirst: false,
    });

    const { data, error, count } = await query;

    // Page past the end: PostgREST answers 416 (PGRST103) instead of an empty
    // list. Treat it as an empty page, with the real total from a head count.
    if (error?.code === "PGRST103") {
      let countQuery = supabase
        .from("articles")
        .select("id", { count: "exact", head: true });
      if (categoryId) countQuery = countQuery.eq("category_id", categoryId);
      if (aiModelId) countQuery = countQuery.eq("ai_model_id", aiModelId);
      for (const p of patterns) countQuery = countQuery.ilike("search_text", p);
      if (hours) {
        countQuery = countQuery.gte("published_at", new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());
      }
      const { count: total } = await countQuery;
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: total ?? 0,
          totalPages: Math.ceil((total ?? 0) / limit),
        },
      });
    }

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
