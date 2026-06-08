# Worklog — crawler (뉴스 크롤러 / 기사 분류)

- 작성일: 2026-06-08
- 브랜치: feat/trending-models-and-audit-fixes
- 담당 영역: 뉴스 RSS 크롤러 + 기사 분류 (`scripts/crawl-articles.mjs`)

## 무엇을 / 왜

뉴스 수집 범위를 **"AI 모델 + AI 기술" 기사로 한정**하고 분류 정확도를 높임.
기존엔 범용 테크 매체에서 산업·경제 뉴스까지 다 들어와 사이트 정체성이 흐릿했음.

### 1. 뉴스 소스 6곳 교체
- 추가: The Verge(AI 섹션), Wired(AI 태그)
- 제거: The Decoder, Google AI Blog
- 유지: TechCrunch, Ars Technica, VentureBeat, MIT Technology Review
- 이유: 외국 독자 트래픽이 높고 AI 기사를 잘 정리하는 매체로 통일. RSS 생존/형식 사전 검증 완료.

### 2. 스코프 필터 (산업·경제 뉴스 제외)
- `모델 태깅 OR AI기술 카테고리(TECH_CATEGORIES)`인 기사만 적재
- 투자/정책/데이터센터/하드웨어/보안 등 산업 주변 뉴스는 crawl 단계에서 drop
- `INDUSTRY_CATEGORIES` 분류 규칙은 "제외 판정용"으로 스크립트 내부에만 유지 (사이드바/DB엔 없음)

### 3. 모델 태깅 정밀화 (오태깅 감소)
- 제목 우선 매칭 → 없으면 본문 2회 이상 언급 시 태깅 (`BODY_MENTION_THRESHOLD = 2`)
- 산업 기사에 묻은 스침 언급은 폐기 (제목 미매칭 + 산업 카테고리면 태깅 취소)

### 검증 결과 (`--dry`)
- 미분류(ai-ml): 64% → **0%**
- 모델 태깅 밀도: 23% → **41%**
- 산업/잡뉴스: **44개 제외**

## 바꾼 파일
- `scripts/crawl-articles.mjs` — FEEDS, classify(), 스코프 필터, 분류 규칙
- `scripts/crawled-articles.json` — dry-run 산출 스냅샷 (⚠️ 아직 실제 DB 미반영)

## 롤백한 것 (다른 Claude 영역이라 최종 원복)
- 산업 카테고리 5개를 `constants.ts` / `Sidebar.tsx` / `schema.sql` / DB에 추가했다가,
  스코프를 모델 중심으로 정한 뒤 전부 원복. 이 파일들에 현재 남은 diff는 **UI 담당 Claude 작업**.
- DB `categories`는 14개로 복귀.

## 남은 TODO
- [ ] 실제 DB 반영: service key로 `node scripts/crawl-articles.mjs` 실행 (다음 크롤부터 적용)
- [ ] 기존 DB 기사 백필(옛 분류/옛 소스) — 아래 LLM 도입 때 함께 재분류 권장
- [ ] LLM(Claude Haiku) 분류 도입: 키워드로 못 거르는 비즈니스 기사 누출(2~3개) 해결
