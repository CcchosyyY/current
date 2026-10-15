import { NextRequest, NextResponse } from "next/server";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { verifyOrigin, createRateLimiter } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/modules/account/service";

// 로그인한 사용자의 뉴스레터 구독 (로그인 이메일 기준).
//   GET    → { subscribed, email }
//   POST   → 구독 (예전에 해지했으면 다시 켬)
//   DELETE → 구독 해지
// newsletter_subscribers는 RLS로 사용자 읽기·수정이 막혀 있어 서버 키로 다루고,
// 대상은 항상 로그인한 본인 이메일로만 한정한다.

const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

async function currentEmail() {
  const user = await requireUser();
  const email = user.email?.toLowerCase();
  if (!email) throw new ApiError("no_email", 400, "이 계정에는 이메일이 없어요");
  return email;
}

async function status(email: string) {
  const { data, error } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .select("is_active")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(`subscription lookup failed: ${error.message}`);
  return !!data?.is_active;
}

export async function GET() {
  try {
    const email = await currentEmail();
    const res = NextResponse.json({ subscribed: await status(email), email });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return toErrorResponse(err);
  }
}

async function setActive(request: NextRequest, active: boolean) {
  if (!verifyOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!limiter.check(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const email = await currentEmail();
    const { error } = active
      ? await supabaseAdmin()
          .from("newsletter_subscribers")
          .upsert({ email, is_active: true, subscribed_at: new Date().toISOString() }, { onConflict: "email" })
      : await supabaseAdmin().from("newsletter_subscribers").update({ is_active: false }).eq("email", email);
    if (error) throw new Error(`subscription update failed: ${error.message}`);
    return NextResponse.json({ subscribed: active, email });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export const POST = (request: NextRequest) => setActive(request, true);
export const DELETE = (request: NextRequest) => setActive(request, false);
