import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { createRateLimiter } from "@/lib/security";
import { requireUser } from "@/modules/account/service";
import { resolveTaskFromSample, SAMPLE_MAX } from "@/modules/task/service";

// 판정 AI를 부르는 API라 사용자당 분당 횟수를 제한한다
const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

const BodySchema = z.object({ sample: z.string().min(1).max(SAMPLE_MAX) });

// POST /api/tasks/from-sample — 샘플을 보고 작업 이름 + 유형을 정한다 (비교 화면 기본 경로)
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!limiter.check(user.id)) throw new ApiError("rate_limited", 429, "잠시 후 다시 시도해 주세요");
    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError("invalid_body", 400, `샘플은 1~${SAMPLE_MAX.toLocaleString()}자로 써 주세요`);
    }
    return NextResponse.json({ data: await resolveTaskFromSample(user.id, parsed.data.sample) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
