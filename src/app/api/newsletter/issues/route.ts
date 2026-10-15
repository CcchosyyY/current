import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/newsletter/issues — 최근 뉴스레터 (공개). scripts/newsletter.mjs가 매일 아침 만든다.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_issues")
    .select("id, issue_date, title, intro, items, sent_at")
    .order("issue_date", { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  const res = NextResponse.json({ data });
  res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res;
}
