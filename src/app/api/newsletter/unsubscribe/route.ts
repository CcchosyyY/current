import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/newsletter/unsubscribe?token=… — 메일 하단 "구독 해지" 링크 (로그인 없이 한 번에).
// 토큰은 구독자마다 다른 UUID라 남의 구독을 해지할 수 없다.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const back = new URL("/newsletter", request.nextUrl.origin);
  if (UUID_RE.test(token)) {
    const { error } = await supabaseAdmin()
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("unsubscribe_token", token);
    back.searchParams.set("unsubscribed", error ? "error" : "1");
  } else {
    back.searchParams.set("unsubscribed", "error");
  }
  return NextResponse.redirect(back);
}
