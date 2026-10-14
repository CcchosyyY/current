import "server-only";
import { listModels } from "@/modules/catalog/service";
import type { CatalogModel } from "@/modules/catalog/types";

/**
 * 평가 모듈 (docs/architecture.md §3-2 ⑧).
 *
 * 1단계: 순위 데이터가 아직 없으므로 서버 키 허용 목록을 기본 순서(default_rank)대로 3개.
 * 2단계에서 작업 유형별 순위로 바꿀 때 이 함수 안만 고친다 — 부르는 쪽은 그대로.
 */
export const SUGGESTED_COUNT = 3;

// 2단계에서 유형별 순위에 쓸 인자. 1단계는 받기만 한다.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function suggestModels(_taskTypeId: string | null): Promise<CatalogModel[]> {
  const allowed = await listModels({ allowedOnly: true });
  return allowed.slice(0, SUGGESTED_COUNT);
}
