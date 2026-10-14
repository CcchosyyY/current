import { NextResponse } from "next/server";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { requireUser } from "@/modules/account/service";
import { getComparison } from "@/modules/comparison/service";
import { IdSchema } from "../schemas";

// GET /api/comparisons/{id} — 비교 다시 보기 (선택 전 블라인드는 그대로 가림)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = IdSchema.safeParse((await params).id);
    if (!id.success) throw new ApiError("not_found", 404, "비교를 찾을 수 없어요");
    return NextResponse.json({ data: await getComparison(user.id, id.data) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
