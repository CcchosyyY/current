import { NextResponse } from "next/server";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { requireUser } from "@/modules/account/service";
import { createComparison, remainingToday } from "@/modules/comparison/service";
import { SAMPLE_MAX } from "@/modules/task/service";
import { CreateBodySchema } from "./schemas";

// POST /api/comparisons — 비교 만들기 (샘플 저장, 순서 섞기). 실행은 /{id}/run
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = CreateBodySchema.safeParse(body);
    if (!parsed.success) {
      const tooLong = typeof body?.sample === "string" && body.sample.length > SAMPLE_MAX;
      throw tooLong
        ? new ApiError("sample_too_long", 400, `샘플은 ${SAMPLE_MAX.toLocaleString()}자까지예요`)
        : new ApiError("invalid_body", 400, "요청 형식이 올바르지 않아요");
    }

    const view = await createComparison(user.id, parsed.data);
    return NextResponse.json(
      { data: view, remainingToday: await remainingToday(user.id) },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
