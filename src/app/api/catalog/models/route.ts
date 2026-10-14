import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/security";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { listModels } from "@/modules/catalog/service";

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// GET /api/catalog/models[?allowed=1] — 비교에 쓸 수 있는 모델 목록 (공개 데이터)
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!limiter.check(ip)) {
      throw new ApiError("rate_limited", 429, "Too many requests. Please try again later.");
    }

    const allowedOnly = request.nextUrl.searchParams.get("allowed") === "1";
    const models = await listModels({ allowedOnly });

    const response = NextResponse.json({ data: models });
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
