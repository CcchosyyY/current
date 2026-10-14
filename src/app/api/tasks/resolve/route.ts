import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { createRateLimiter } from "@/lib/security";
import { requireUser } from "@/modules/account/service";
import { resolveTask, TASK_NAME_MAX } from "@/modules/task/service";

// 판정 AI를 부를 수 있는 API라 사용자당 분당 횟수를 제한한다
const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

const BodySchema = z.object({
  name: z.string().min(1).max(TASK_NAME_MAX),
  pickedTypeId: z.uuid().optional(),
  samplePreview: z.string().max(8000).optional(),
});

// POST /api/tasks/resolve — 작업 이름 → 작업 + 작업 유형 (이야기 2)
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!limiter.check(user.id)) {
      throw new ApiError("rate_limited", 429, "잠시 후 다시 시도해 주세요");
    }

    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError("invalid_body", 400, `작업 이름은 1~${TASK_NAME_MAX}자로 써 주세요`);
    }

    const data = await resolveTask(user.id, parsed.data.name, {
      pickedTypeId: parsed.data.pickedTypeId,
      samplePreview: parsed.data.samplePreview,
    });
    return NextResponse.json({ data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
