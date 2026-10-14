import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, toErrorResponse } from "@/lib/api-error";
import { requireUser } from "@/modules/account/service";
import { suggestTasks } from "@/modules/task/service";

const QuerySchema = z.object({ q: z.string().max(100).default("") });

// GET /api/task-types/suggest?q= — 자동완성: 내 예전 작업 이름 + 기존 작업 유형
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = QuerySchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? undefined });
    if (!parsed.success) throw new ApiError("invalid_query", 400, "검색어가 너무 길어요");

    const data = await suggestTasks(user.id, parsed.data.q);
    return NextResponse.json({ data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
