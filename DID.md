# Done

> **블로그 발행 대기 버퍼** — 직전 1개 세션 섹션만 유지하고, 블로그 발행 후 비웁니다.
> 영구 기록: `git log --oneline`(한 일) · `docs/worklog/<기능>.md`(왜/어떻게)

## 2026-06-08 — Google 로그인 완성 · 모델 페이지/모달 개편 · 크롤러 스코프 (멀티에이전트)

> 같은 워킹트리에서 3개 컨텍스트 병렬 작업. 영역별 상세는 `docs/worklog/{auth-and-ui,ai-model-pages,crawler}.md` 참고.

### 완료 항목
- **인증/북마크**: Google OAuth 로그인 진입 경로 완성 — `auth/callback`(code→세션 교환, open-redirect 가드) + `UserMenu` 재작성(Sign in/아바타/Sign out). **북마크 저장 버그 수정**(핵심): `verifyOrigin`이 포트 불일치(:3000 기대 vs 실제 :3003)로 모든 POST/DELETE를 403 차단하던 것을 실제 요청 Host 비교로 변경(뉴스레터 구독도 함께 정상화). 미들웨어를 `src/middleware.ts`로 이동(루트 위치라 무시되던 것 → `/saved` 보호·세션 갱신 복구).
- **모델 페이지/모달**: 상세 모달 개편(고정 헤더+본문 스크롤), `/models/[slug]` 모델별 뉴스 페이지 신설(히어로+NewsCard 그리드+load-more), 37개 모델 리치 콘텐츠(`model-details.ts`), 공용 컴포넌트 추출(`ModelActions`/`ModelInfoSections`로 모달·페이지 중복 제거), `/api/articles`의 `ai_model`이 slug도 허용.
- **Grok 이미지 크래시 수정**: 잘못된 `image_url`(http·.mp4)이 `next/image`를 크래시시키던 것 → `image-config.ts` 단일 소스(호스트 allowlist + `isRenderableImageUrl`)를 `next.config.ts`/`transforms.ts`가 공유, 무효 URL은 null 처리.
- **사이드바/헤더/카드 UI**: 카테고리 아이콘 색 hover/active에만 적용, `all`(전체) 카테고리 분리(기존 ai-ml이 전체로 혼동되던 것), NEW 신선도 점(6시간), active accent bar, 헤더 우측 그룹 패딩, 기사 상세 액션 버튼을 본문 위로 이동.
- **크롤러 스코프**: 뉴스 소스 6곳 교체(Verge/Wired 추가, Decoder/Google AI Blog 제거), 수집 범위를 "AI 모델+기술"로 한정(산업/경제 44건 제외), 모델 태깅 정밀화(제목 우선→본문 2회+). dry-run: 미분류 64%→0%, 태깅밀도 23%→41%.
- **헤더 NAV**: `Models` 링크 추가(모델 페이지 연결 마무리).

### 검증 (2026-06-08, dev :3003)
- `tsc --noEmit` 통과, 페이지 7종 200(`/saved`만 307→홈=보호 정상), API 5종 200(`ai_model=chatgpt` slug 필터 동작)
- **verifyOrigin 수정 확인**: 동일출처→401(쿠키 없을 때), 외부출처→403. 보안 가드(미존재 slug·빈 검색→빈결과) 동작.
- 북마크 코드 정합성: 훅↔API `article_id` 필드명 일치, 409(중복) 처리 OK.
- **미확인(사용자 몫)**: 실제 Google 로그인→북마크 저장→/saved 표시 end-to-end(실 OAuth라 자동화 불가).

### 변경 사항
| 영역 | 변경 내용 |
|------|-----------|
| 인증 | `auth/callback/route.ts`(신규), `UserMenu`(재작성), `src/middleware.ts`(이동), `security.ts`(verifyOrigin) |
| 모델 | `model-details.ts`(37모델), `ModelDetailModal`(재구성), `models/[slug]/page.tsx`(신규), `ModelActions`/`ModelInfoSections`/`ModelRelatedNews`(신규), `useModelArticles`(신규), `articles` API slug 필터 |
| 이미지 | `image-config.ts`(신규 단일소스), `next.config.ts`/`transforms.ts` 연동 |
| UI | `Sidebar`/`Header`/`ArticleActions`/`article/[id]`, `types.ts`(all), `useArticles`/`useCategoryCounts`/counts API |
| 크롤러 | `scripts/crawl-articles.mjs`(FEEDS·스코프 필터·분류) |

### 아키텍처 노트
- `category=all`은 프론트(`useArticles`)에서 파라미터 생략으로 처리 → API에 직접 `?category=all`을 던지면 0건(미존재 카테고리 가드)이지만 UI 동작엔 무관.
- 크롤러 `crawled-articles.json`은 dry-run 스냅샷 — **실제 DB 미반영**(다음 크롤부터). 현재 DB는 6/4 데이터라 NEW 점 미표시가 정상.
- `constants.ts`의 `/models` NAV 한 줄은 다른 컨텍스트의 `all` 카테고리 추가와 섞여 별도 커밋(0f19fe5)으로 정리됨.

---
