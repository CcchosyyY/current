// 모델 카탈로그 — 클라이언트도 가져갈 수 있는 타입만 둔다 (docs/architecture.md §3-2 ④)

/** 비교에 쓸 수 있는 OpenRouter 모델 하나 (catalog_models 행을 화면용으로 정리한 것) */
export interface CatalogModel {
  id: string; // OpenRouter 모델 ID, 예: openai/gpt-5-nano
  canonicalSlug: string | null; // 버전 포함, 예: openai/gpt-5-nano-2025-08-07
  name: string; // 표시 이름, 예: GPT-5 Nano
  provider: string; // 예: openai
  brand: string | null; // ai_models.slug, 예: chatgpt → 기존 로고·브랜드색 재사용
  promptPrice: number; // 입력 토큰당 USD
  completionPrice: number; // 출력 토큰당 USD
  isFree: boolean;
  contextLength: number | null;
  serverAllowed: boolean; // 서버 키로 실행 가능 (R-25)
  defaultRank: number | null; // 순위 데이터가 없을 때 기본 추천 순서
}

export interface CatalogSyncResult {
  fetched: number; // OpenRouter가 준 전체 모델 수
  kept: number; // 비교 대상으로 남긴 수 (텍스트 출력, 별칭·배치·라우터 제외)
  added: number; // 처음 본 모델 (first_seen_at = 지금)
  deactivated: number; // 이번 목록에 없어 is_active=false가 된 모델
  allowedMissing: string[]; // 허용 목록인데 OpenRouter에서 사라진 모델 → 관리자 확인 필요
}
