import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api-error";
import { requireUser } from "@/modules/account/service";
import { remainingToday } from "@/modules/comparison/service";
import { suggestModels } from "@/modules/evaluation/service";
import { IdSchema } from "../schemas";

// GET /api/comparisons/suggest?taskTypeId= — 기본 모델 3개 + 오늘 남은 비교 수
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const typeId = IdSchema.safeParse(request.nextUrl.searchParams.get("taskTypeId"));
    const [models, remaining] = await Promise.all([
      suggestModels(typeId.success ? typeId.data : null),
      remainingToday(user.id),
    ]);
    return NextResponse.json({ data: { models, remainingToday: remaining } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
