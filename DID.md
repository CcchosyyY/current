# Done

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

## 2026-06-06 — 모델 상세 모달 · 회사 로고 라이브러리 · 뉴스 스크롤

### 완료 항목
- **Today's AI News**: 처음 5개만 보이고 내부 스크롤 (5번째 기사 높이를 동적 측정해 컨테이너 높이 고정)
- **기사 로고 fallback 체계**: AI 모델 → 본문에서 감지한 회사 → 사이트 로고(파란 삼각형) 우선순위
- **회사 로고 라이브러리**: 미국 시총 상위 + AI 기업 171곳 데이터(`companies.ts`), 로고 170개 다운로드(DuckDuckGo→Google fallback, 로컬 저장)
- **기사↔회사 자동 매칭**(`company-match`): 제목·매체명에서 회사 감지, 요약 제외로 오탐 차단
- **모델 상세 모달**(`ModelDetailModal`): AI Models 카드 클릭 → 브랜드 글로우 헤더·로고·태그·시총/창립/본사 stat·About·링크. Figma에 먼저 디자인 후 코드 구현
- **ModelCard**: hover popover 제거 → 클릭 모달 방식

### 작업 방식
- 디자인 리서치(앱스토어 anatomy·다크모드 모달 best practice) → Figma 모달 시안(브랜드 글로우 + surface 레이어) → 코드 구현
- Figma 스크린샷 렌더 버그 발견 후 워크플로 전환: **localhost 러프 구현 → Figma 상세 → 코드 반영**
- 검증: `tsc --noEmit` 통과, dev 런타임 `/`·`/models` 200

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 모달 | `ModelDetailModal` 신규, `ModelCard` 클릭 모달로 재작성(hover 제거) |
| 데이터 | `companies.ts`(171곳 + 상세 18곳), `company-logos.json`, `findCompany`/`COMPANY_DETAILS` |
| 로고 | `scripts/fetch-company-logos.mjs`, `public/icons/companies` 170개, `google.svg` |
| 기사 | `article-logo`·`company-match`, 대시보드 로고 fallback + Today's News 스크롤 |

### 아키텍처 노트
- 회사 로고는 ico/png/jpeg 혼합 포맷 → `company-logos.json` 맵으로 확장자 관리, `<img>` 렌더(외부 의존 0, 로컬 저장)
- Figma MCP `get_screenshot`이 굵은 텍스트를 흰 박스로 렌더하는 버그 → 실제 파일/웹은 정상. 이후 localhost 우선 작업으로 전환
- Figma 모달 시안: node `46:2` (fileKey `SwGySWU706nVMABEEK65hC`)

---

## 2026-06-04 — 코드 점검 · UI 정리 · 신규 모델 · 분류 개선 · 보안 (멀티에이전트)

### 완료 항목
- **데이터 복구**: Supabase `zlpdtswbgteufzszjigy` 재가동 → 코드 정합 스키마 재구축(카테고리 14·모델 37), RSS 크롤러 신규 작성 → 기사 63건 적재, 클릭→상세 end-to-end 검증
- **신규 AI 모델 13개**(2025–26 트렌드, 웹 리서치 검증): Sora·Veo·Kling·ElevenLabs·Manus·Genspark·Qwen·Kimi K2·Ideogram·Recraft·Glean·Cline·Higgsfield → constants/types/DB/스키마 + monogram 아이콘
- **모델 hover 상세 모달**(`ModelCard`) + **`/models` See-All 페이지**(카테고리 필터)
- **기사 분류 정확도 개선**: 부분일치 오탐 제거(coding 16→4), intent(검색/에이전트) 우선, 신규 모델 트리거 → 재크롤
- **보안**: `.or()` 검색 인젝션 차단, 이미지 `**`→CDN 허용목록(SSRF/오픈프록시 차단), 크롤러 anon 쓰기 가드, 기사 ID UUID 검증
- **정확성/UI**: 미존재 카테고리 빈결과, bookmarks 모델 slug, 배열 가드, 트렌딩 기본기간/NaN, 전역 focus-visible 링, Toast aria-live, Header ⌘/Ctrl 분기 등

### 작업 방식
- Claude Code 워크플로 2회: ① 감사+리서치(5 에이전트, 코드/보안/UI/분류/트렌드) → 구현 → ② 적대적 리뷰(17 에이전트, 변경분 회귀/보안/접근성 검증) → 확정 결함 9건 수정
- 검증: `tsc --noEmit` 통과, `next build` 통과, 런타임 HTTP(이미지 최적화/검색/페이지) 확인

### 변경 사항
| 영역 | 변경 내용 |
|------|-----------|
| 모델 | AI_MODELS 24→37, AIModelSlug 13개 추가, 아이콘 13 SVG, DB/schema.sql 시드 동기화 |
| 컴포넌트/페이지 | `ModelCard`(hover 모달, portal), `/models` 페이지, 대시보드 모델 그리드 교체 |
| 크롤러 | `scripts/crawl-articles.mjs` — MODEL/CATEGORY 규칙 개선, view_count/is_trending, service_role 가드 |
| 보안/API | articles 검색 sanitize·미존재카테고리, articles/[id] UUID, bookmarks slug, next.config 이미지 허용목록 |
| UI | globals focus 링, Toast aria-live, newsletter 토큰, Header kbd, Sidebar 정리 |

### 아키텍처 노트
- 기존 schema.sql이 코드와 불일치(카테고리 슬러그·`ai_models.slug` 누락·articles 컬럼 누락)였음 → 코드 기준으로 재정렬, 파일을 source of truth로 동기화
- 기사 적재는 RLS상 service_role 키 권장(anon은 `--allow-anon-insert` + 임시정책 명시 필요). 이번 세션은 임시 anon 정책으로 적재 후 즉시 제거
- Figma 라이브 빌드는 승인 기반 인터랙티브 작업이라 무인 실행하지 않음 — `FIGMA_UI_TASK.md`에 신규 스코프만 반영

---

## 2026-06-04 — Figma 디자인 시스템 구축 (웹 화면 재현 + 컴포넌트화)

### 완료 항목
- 실서버(dev)를 띄워 5개 페이지를 스크린샷 → Figma에 1:1 데스크톱 프레임으로 재현 (Dashboard / Trending / Saved / Newsletter / Article)
- 사이드바 카테고리 아이콘을 컬러 사각형 → 실제 lucide 아이콘으로 교체 (5프레임 × 14개 = 70항목)
- Figma Variables `Color` 컬렉션(29 토큰) 생성 — scope + WEB code syntax(실제 CSS 변수명) 설정
- 대시보드 왼쪽에 디자인 시스템 보드 구축: 색상 스와치 / 아이콘 세트 / 컴포넌트
- 실제 Figma 컴포넌트 생성: Logo, Button(3 variant), Category Pill, Avatar, Search Field, Category Nav Item(2 variant), Model Card, News Card
- (작업 중 발견) Supabase 프로젝트 다운 → 스크린샷용 mock fallback 임시 적용 후 git 원복

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| Figma 화면 | 5개 페이지 데스크톱 프레임(1440) — 다크+블루, 모델 브랜드 SVG, 한글 Noto Sans KR |
| 아이콘 | 사이드바 14 카테고리 실제 lucide 벡터화 (lucide-react에서 path 추출) |
| 색상 토큰 | Color Variables 29개 (bg/border/text/accent/status + 카테고리 14) |
| 컴포넌트 | 8종 컴포넌트 + Button·NavItem variant set |
| 코드 | 변경 없음 (산출물은 Figma 파일에 존재) |

### 아키텍처 노트
- 코드 토큰(globals.css / constants.ts)을 Figma Variables로 이관, code syntax를 `var(--…)` CSS 변수명에 맞춰 디자인-코드 동기화 기반 마련
- Supabase 프로젝트(`zlpdtswbgteufzszjigy`) DNS 미해석 → 라이브 실데이터 미연동 상태
- Figma fileKey: `SwGySWU706nVMABEEK65hC`

---

## 2026-03-27 — UI/UX 리디자인 (카테고리 + 사이드바 + 폰트)

- 카테고리 5→14개(Core 7 + Extended 7), 사이드바 A안 리디자인(컬러 아이콘·Main/More 그룹·220px)
- 폰트 Space Grotesk/Inter → Nunito/Nunito Sans(둥근 산세리프), 기사 텍스트 13→11px
- `Category` 타입에 color/group 추가, mock 카테고리 슬러그 매핑
- 당시 미해결(→ TODO 이관): 한글 글리프 폴백(Noto Sans KR), 사이드바 태블릿 반응형
