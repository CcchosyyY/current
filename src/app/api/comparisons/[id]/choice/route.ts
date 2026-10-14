import { NextResponse } from "next/server";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { requireUser } from "@/modules/account/service";
import { choose } from "@/modules/comparison/service";
import { ChoiceBodySchema, IdSchema } from "../../schemas";

// POST /api/comparisons/{id}/choice — 선택 { kind: pick|tie|all_bad, runId? } → 모델 공개
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = IdSchema.safeParse((await params).id);
    if (!id.success) throw new ApiError("not_found", 404, "비교를 찾을 수 없어요");
    const body = ChoiceBodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new ApiError("invalid_body", 400, "선택 형식이 올바르지 않아요");

    const runId = body.data.kind === "pick" ? body.data.runId : undefined;
    const view = await choose(user.id, id.data, {
      kind: body.data.kind,
      runId,
      decisionMs: body.data.decisionMs,
    });
    return NextResponse.json({ data: view });
  } catch (err) {
    return toErrorResponse(err);
  }
}
