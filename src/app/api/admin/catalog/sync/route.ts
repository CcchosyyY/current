import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/modules/account/service";
import { syncCatalog } from "@/modules/catalog/service";

// POST /api/admin/catalog/sync — OpenRouter 모델 목록을 catalog_models에 반영 (헤더 x-admin-secret 필요)
export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const result = await syncCatalog();
    return NextResponse.json({ data: result });
  } catch (err) {
    return toErrorResponse(err);
  }
}
