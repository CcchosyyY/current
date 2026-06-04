# Done

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

### 완료 항목
- 카테고리 시스템 확장: 5개 → 14개 (Core 7 + Extended 7)
- 사이드바 A안 리디자인 (컬러 아이콘, Main/More 그룹 구분, 카테고리별 active 색상)
- 폰트 변경: Space Grotesk + Inter → Nunito + Nunito Sans (둥근 느낌)
- 기사 텍스트 크기 조정 (13px → 11px)
- Category 타입에 color, group 필드 추가

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 카테고리 | ai-ml, llm, image-gen, video-gen, music-audio, coding, ai-search + 확장 7개 |
| 사이드바 | 컬러 아이콘, Main/More 섹션 분리, 220px 너비, 스크롤 지원 |
| 폰트 | Nunito (헤딩) + Nunito Sans (본문) — 둥근 산세리프 |
| 타입 | CategorySlug 14개, Category에 color/group 추가 |
| mock 데이터 | 기존 카테고리 슬러그 매핑 (claude→llm, global-news→ai-ml 등) |

### 발견된 이슈
- 14개 카테고리 중 12개는 기사 데이터 0건 (mock 보충 필요)
- Nunito에 한글 글리프 없음 (Noto Sans KR 폴백 추가 필요)
- 사이드바 220px → 태블릿 반응형 튜닝 필요

---

## 2026-03-23 — AI 뉴스 큐레이션 플랫폼 MVP 구현

### 완료 항목
- MVP 전체 구현 (대시보드, 트렌딩, 북마크, 뉴스레터, 기사 상세 5개 페이지)
- API 4개 엔드포인트 구축 (articles, ai-models, bookmarks, newsletter)
- 보안 인프라 적용 (Rate Limiting, CSRF, Zod, 보안 헤더)
- 모바일 반응형 + Framer Motion 애니메이션 전면 적용
- Command Palette 검색 (Cmd+K), 북마크/공유, 토스트 알림 구현
- PPT 초안용 프로젝트 상세 정리

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 대시보드 | 뉴스 피드, AI 모델 디렉토리(24개), 전문가 인사이트, 카테고리 필터 |
| 페이지 | 트렌딩(기간 필터), 북마크(Saved), 뉴스레터(구독), 기사 상세 |
| 컴포넌트 | Header, Sidebar, NewsCard, AIModelCard 등 11개 + 스켈레톤 2개 |
| API/보안 | Rate Limiting, CSRF, Zod 검증, Cache-Control, 보호 라우트 |
| UX | Command Palette, 사이드바 접기/펼치기, 모바일 오버레이, 토스트 |
| 커스텀 훅 | useBookmarks, useShare, useToast 3개 |

### 아키텍처 노트
- Server Component 우선 설계, 인터랙션 필요 시에만 Client Component 분리
- Mock 데이터로 전체 흐름 완성 후 DB 연동 전략 채택
- Claude Code 병렬 에이전트 12개 팀 활용, 2회 세션(약 30분)으로 구현 완료
