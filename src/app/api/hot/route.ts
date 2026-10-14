import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/security";
import { HOT_WINDOW_HOURS } from "@/lib/constants";
import type { DBArticleRow } from "@/lib/transforms";
import type { HotType } from "@/lib/types";

const hotLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// 사건의 "첫 기사"를 정확히 찾으려면 노출 기간보다 넉넉히 거슬러 읽어야 한다.
// (기간만큼만 읽으면 오래된 사건의 후속 기사가 첫 기사로 착각돼 다시 Hot에 뜬다)
// 크롤러가 기존 사건을 찾는 범위(HOT_EVENT_LOOKBACK_DAYS = 7)와 맞춘다.
const LOOKBACK_HOURS = 7 * 24;
const MAX_EVENTS = 6;

export interface HotEventRow {
  key: string;
  type: HotType;
  reason: string;
  firstAt: string;
  lead: DBArticleRow;
  articles: { id: string; title: string; source_name: string; published_at: string }[];
}

// GET /api/hot — Hot 기사를 사건(hot_event) 단위로 묶어서 반환
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!hotLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const now = Date.now();
    const since = new Date(now - LOOKBACK_HOURS * 3_600_000).toISOString();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select(
        `
        *,
        categories(name, slug, color),
        ai_models(name, slug, company, brand_color, logo_url)
      `,
      )
      .not("hot_type", "is", null)
      .gte("published_at", since)
      .order("published_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Hot query error:", error);
      return NextResponse.json({ error: "Failed to fetch hot events" }, { status: 500 });
    }

    // 오래된 순으로 읽으므로 각 묶음의 첫 행이 사건의 첫 기사(= 대표)가 된다
    const groups = new Map<string, DBArticleRow[]>();
    for (const row of (data ?? []) as DBArticleRow[]) {
      const key = row.hot_event ?? `article-${row.id}`;
      const group = groups.get(key);
      if (group) group.push(row);
      else groups.set(key, [row]);
    }

    const events: HotEventRow[] = [];
    for (const [key, rows] of groups) {
      const lead = rows[0];
      const type = lead.hot_type as HotType;
      const firstAt = lead.published_at ?? lead.created_at;
      if (now - new Date(firstAt).getTime() > HOT_WINDOW_HOURS[type] * 3_600_000) continue;
      events.push({
        key,
        type,
        reason: lead.hot_reason ?? lead.title,
        firstAt,
        lead,
        articles: rows.map((r) => ({
          id: r.id,
          title: r.title,
          source_name: r.source_name,
          published_at: r.published_at ?? r.created_at,
        })),
      });
    }

    // 긴급이 먼저, 그 안에서는 최근 사건부터
    events.sort((a, b) => {
      if (a.type !== b.type) return a.type === "breaking" ? -1 : 1;
      return new Date(b.firstAt).getTime() - new Date(a.firstAt).getTime();
    });

    const response = NextResponse.json({ data: events.slice(0, MAX_EVENTS) });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (err) {
    console.error("Unexpected error in GET /api/hot:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
