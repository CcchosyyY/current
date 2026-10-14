import { NextResponse } from "next/server";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { requireUser } from "@/modules/account/service";
import { runComparison } from "@/modules/comparison/service";
import { IdSchema } from "../../schemas";

// 모델 타임아웃 60초 + 여유. 배포(Vercel) 시 함수 시간 제한도 이 값을 따른다.
export const maxDuration = 90;

// POST /api/comparisons/{id}/run — 모델들을 병렬로 실행하고 결과를 돌려준다
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = IdSchema.safeParse((await params).id);
    if (!id.success) throw new ApiError("not_found", 404, "비교를 찾을 수 없어요");
    return NextResponse.json({ data: await runComparison(user.id, id.data) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
