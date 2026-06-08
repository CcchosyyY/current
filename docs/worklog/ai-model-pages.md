# Worklog — AI 모델 상세 모달 개편 · 모델별 뉴스 페이지 (+ Grok 이미지 에러 수정)

- 브랜치: `feat/trending-models-and-audit-fixes`
- 작성: 2026-06-08
- 비고: 같은 워킹트리에서 3개의 Claude가 병렬 작업 중 → 이 문서/커밋은 **이 컨텍스트에서 직접 만든·수정한 파일만** 포함한다.

---

## 무엇을 / 왜 했나

### 1. Grok 기사 이미지 에러 수정 (버그픽스)
- 증상: Grok 기사(`/article/[id]`) 진입 시 `next/image`가
  `Invalid src prop ... hostname not configured`로 페이지(서버 컴포넌트)를 크래시.
- 원인: 크롤링된 `image_url`이 `http://...prompt-to-video.mp4` 처럼
  ① `http://`(설정은 https만 허용) ② `.mp4` 비이미지 파일. DB에 동일 패턴 3건.
- 해결: 렌더 계층에서 차단. `image-config.ts`에 호스트 allowlist + `isRenderableImageUrl()`
  검증기를 두고, `next.config.ts`(remotePatterns)와 `transforms.ts`(dbArticleToArticle)가
  **같은 단일 소스**를 공유. 잘못된 URL은 `imageUrl=null`로 떨궈 모든 소비처가 안전.

### 2. AI 모델 상세 모달 개편
- 고정 헤더(로고+이름+회사+카테고리, 우측 Visit/Try 버튼), 본문 스크롤.
- 본문: 최신 뉴스(2건) → 접이식 설명(Overview·Key features·Best for) → Specs → About.
- 모델 식별/버튼/설명 블록을 공용 컴포넌트(`ModelActions`, `ModelInfoSections`)로 추출해
  모달과 페이지가 공유(중복 제거).

### 3. 37개 모델 리치 콘텐츠
- `model-details.ts`에 모델별 overview(2~3문단)·highlights·bestFor·specs 작성(37/37).

### 4. 모델별 뉴스 페이지 `/models/[slug]`
- 풀폭 히어로(풀블리드) + 접이식 짧은 설명(Read more) + **기사 카드 그리드(NewsCard)** + 더보기.
- 상세(Specs/About 등)는 헤더의 `👁 Quick view` 버튼 → 모달로 분리. "기사 중심" 페이지.
- 데이터: `useModelArticles(slug)` 훅(load-more), `/api/articles?ai_model=<slug>` 필터.

### 5. 모델 카드 동작 (ChatGPT 파일럿)
- `ModelCard`: `PAGE_FIRST_SLUGS`(현재 `chatgpt`)는 카드 클릭 → 페이지 이동,
  우상단 `👁`(호버 시 "Quick view" 툴팁) → 모달. 그 외 모델은 기존처럼 클릭 시 모달.

### 6. API
- `/api/articles`의 `ai_model` 파라미터가 UUID뿐 아니라 **slug**도 허용(카테고리 slug→id 방식 동일).

---

## 바꾼 파일 (이번 커밋에 포함)

신규
- `src/lib/image-config.ts` — 이미지 호스트 allowlist + `isRenderableImageUrl`
- `src/lib/model-details.ts` — 37개 모델 리치 콘텐츠
- `src/components/ModelRelatedNews.tsx` — 모달의 최신 뉴스(2건) + See all 링크
- `src/components/model/ModelActions.tsx` — Visit/Try 버튼(공용)
- `src/components/model/ModelInfoSections.tsx` — 설명/Specs/About(공용, collapsible·show prop)
- `src/lib/hooks/useModelArticles.ts` — 모델별 기사 load-more 훅
- `src/app/(dashboard)/models/[slug]/page.tsx` — 모델 뉴스 페이지
- `docs/worklog/ai-model-pages.md` — 이 문서

수정
- `next.config.ts` — remotePatterns를 image-config 단일 소스로
- `src/lib/transforms.ts` — imageUrl 검증/무효화
- `src/app/api/articles/route.ts` — ai_model slug 필터
- `src/components/ModelCard.tsx` — 페이지 이동 + Quick view(파일럿)
- `src/components/ModelDetailModal.tsx` — 공용 컴포넌트 기반 재구성

## 제외 / 보류 (다른 Claude 작업 보호)
- `src/lib/constants.ts` — **이번 커밋에서 제외.** `NAV_LINKS`에 `{ /models, Models }` 한 줄을
  추가했으나, 같은 파일에 다른 Claude의 `CATEGORIES` `"all"` 항목 추가가 섞여 있어 통째 add 불가.
  내 한 줄은 워킹트리에 **언커밋 상태로 남김.** (추후 별도/협의 커밋)
- `src/components/ArticleListItem.tsx` — 초기엔 페이지 기사 행으로 만들었으나 `NewsCard` 카드로
  대체되어 미사용 → **삭제**(커밋 안 함).

## 남은 TODO
- [ ] `PAGE_FIRST_SLUGS`를 전체 모델로 확장(현재 `chatgpt`만 파일럿) — UX 확정 후.
- [ ] 페이지 설명 펼침 시 Key features/Best for 포함 여부 최종 확정(현재 모달과 동일하게 포함).
- [ ] `NAV_LINKS`의 Models 링크(constants.ts) 별도 커밋 또는 다른 Claude와 병합 협의.
- [ ] `model-details.ts`의 가격/밸류에이션 등 시점 의존 값 주기적 갱신.
- [ ] 기사 0건 모델 다수 — 크롤링/매핑 보강 시 페이지가 자연히 채워짐.
