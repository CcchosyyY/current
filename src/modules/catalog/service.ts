import "server-only";
import { rowToModel, selectActive, selectByIds } from "./repository";
import type { CatalogModel } from "./types";

// 모델 카탈로그 모듈의 공개 함수 (docs/architecture.md §3-2 ④).
// 다른 모듈은 repository를 직접 부르지 않고 여기를 통한다.

export { syncCatalog } from "./sync";

/** 비교에 쓸 수 있는 모델. allowedOnly면 서버 키 허용 목록만, 기본 순서대로 */
export async function listModels(opts: { allowedOnly?: boolean } = {}): Promise<CatalogModel[]> {
  const rows = await selectActive({ allowedOnly: opts.allowedOnly ?? false });
  return rows.map(rowToModel);
}

/** ID로 여러 모델 (비활성 포함 — 실행 모듈이 is_active·허용 여부를 따로 판단) */
export async function getModels(
  ids: string[],
): Promise<Map<string, CatalogModel & { isActive: boolean }>> {
  const rows = await selectByIds(ids);
  return new Map(rows.map((r) => [r.id, { ...rowToModel(r), isActive: r.is_active }]));
}
