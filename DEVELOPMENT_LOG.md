# Current by Jyos — 작업 로그

> 작성일: 2026-03-23
> 총 작업 시간: 약 30분 (2회 세션)
> 방식: 병렬 에이전트 팀 (총 12개 팀 투입)

---

## 1차 작업 (약 15분)

### 1단계: 분석 (3개 팀 병렬)

| 팀 | 작업 | 주요 발견 |
|----|------|----------|
| 보안 감사팀 | OWASP 기준 10개 항목 심층 분석 | High 1건 (인메모리 rate limiter), Medium 3건 |
| 코드 품질팀 | 성능, 타입, 접근성 분석 | Top 10 개선점 도출, `<img>` → `next/image` 필요 |
| UI 리서치팀 | Linear/Vercel/Raycast 트렌드 조사 | 애니메이션 부재, 반응형 미흡, Command Palette 권장 |

### 2단계: 구현 (4개 팀 병렬)

#### 프론트엔드 UX팀
- **사이드바 접기/펼치기**: 240px ↔ 60px 토글, `transition-[width]` 애니메이션
- **모바일 오버레이**: 햄버거 메뉴 → 오버레이 사이드바, ESC/외부 클릭 닫기
- **localStorage 저장**: 접힘 상태 유지
- **스켈레톤 로딩**: NewsCardSkeleton, AIModelCardSkeleton 생성
- 수정 파일: `Sidebar.tsx`, `layout.tsx` / 새 파일: `SidebarToggle.tsx`, `skeletons/*`

#### 인터랙션팀 (Framer Motion)
- **뉴스 접기/펼치기**: `AnimatePresence` + `height: auto` 전환
- **AI Models 필터**: `LayoutGroup` + stagger 재진입 애니메이션
- **Expert Insights**: stagger fade-in + slide-up
- **Trending 카드**: stagger 진입 (0.05초 간격)
- **Newsletter**: 구독 성공 `scale + opacity` 전환, Past Issues stagger
- **Saved**: `SavedGrid.tsx` 클라이언트 컴포넌트 분리 (서버 컴포넌트 유지)
- 수정 파일: `page.tsx`, `trending/page.tsx`, `newsletter/page.tsx`, `saved/page.tsx` / 새 파일: `SavedGrid.tsx`

#### 검색팀 (Command Palette)
- **Cmd+K / Ctrl+K** 전역 단축키로 검색 모달 토글
- **React Portal**로 body에 마운트, backdrop-blur 배경
- **통합 검색**: Articles, AI Models, Pages 카테고리 그룹화
- **키보드 네비게이션**: ↑↓ 탐색, Enter 이동, ESC 닫기
- **Header 연결**: 검색 input → button 변환, `⌘K` 뱃지 표시
- 수정 파일: `Header.tsx` / 새 파일: `SearchModal.tsx`

#### 백엔드팀
- **env.ts lazy getter**: 빌드 타임 에러 방지, Supabase 클라이언트 3곳 연동
- **보호 라우트**: middleware에서 `/saved` 미인증 시 리디렉션
- **Cache-Control**: articles(60초), ai-models(300초), mutations(no-store)
- 수정 파일: `env.ts`, `supabase/client.ts`, `server.ts`, `middleware.ts`, `middleware.ts(루트)`, API 라우트 4개

### 1차 작업에서 추가로 직접 수정한 것

#### 보안 강화
- `verifyOrigin` CSRF 강화: Origin 없으면 차단 (기존: 무조건 통과)
- `safeParseBody` 유틸 추가, 모든 POST/DELETE 라우트 적용
- `/api/articles`에 rate limiting(60req/min) 추가

#### 모바일 반응형
- 사이드바 `hidden lg:block`
- 헤더 모바일 대응 (검색 아이콘, 간격/폰트 축소)
- AI Models 그리드 `grid-cols-2 sm:3 md:4 lg:5`
- NewsCard 리스트 모드 `line-clamp-2`, 액션 `hidden sm:flex`
- Trending 카드 간격/패딩/썸네일 반응형

#### 이미지 최적화
- `<img>` → `next/image` 전환 (NewsCard, Trending, Article Detail)
- `next.config.ts`에 `remotePatterns` (placehold.co)

#### 접근성
- `<nav aria-label>` 2곳
- 뉴스 토글 `aria-expanded` + `aria-controls`
- 뉴스레터 이메일 `<label>` (sr-only)
- Article not found → `notFound()` (HTTP 404)

#### 코드 최적화
- Trending 정렬 `useMemo`
- Saved 페이지 불필요한 `"use client"` 제거
- 카드 호버 효과 강화 (`shadow-lg shadow-primary/5 hover:-translate-y-0.5`)

---

## 2차 작업 (약 15분)

### 1단계: 공통 인프라 + 검사

#### 훅/유틸팀
- `useBookmarks.ts`: localStorage 기반 북마크 상태 (Set, toggle, isBookmarked)
- `useShare.ts`: Web Share API + 클립보드 폴백, onSuccess 콜백
- `useToast.ts`: React Context 기반 토스트 (3초 자동 제거, 최대 3개)
- 새 파일: `src/lib/hooks/useBookmarks.ts`, `useShare.ts`, `useToast.ts`

#### 검사팀 (전체 코드 종합 검사)
발견 및 수정한 버그:
| 심각도 | 파일 | 내용 |
|--------|------|------|
| Critical | `api/ai-models/route.ts` | Zod 카테고리 enum이 types.ts와 완전 불일치 — 필터 작동 불가 버그 |
| Medium | `api/ai-models/route.ts` | rate limiting 누락 |
| Medium | `api/bookmarks/route.ts` | GET 핸들러에 rate limiting 누락 |
| Medium | `constants.ts` | AI_MODEL_CATEGORIES에 "Search" 탭 누락 |
| Low | `AIModelCardSkeleton.tsx` | 실제 카드와 레이아웃 불일치 → 전면 재작성 |

### 2단계: 기능 구현 (4개 팀 병렬)

#### 인터랙션 연결팀
- **북마크 버튼 실제 동작**: `useBookmarks` 연결, Bookmark ↔ BookmarkCheck 아이콘 전환
- **공유 버튼 실제 동작**: `useShare` 연결, Web Share API / 클립보드 복사
- **토스트 피드백**: "Saved to bookmarks", "Link copied!" 등
- **기사 상세 액션 분리**: `ArticleActions.tsx` 클라이언트 컴포넌트 (서버 컴포넌트 유지)
- 수정 파일: `NewsCard.tsx`, `article/[id]/page.tsx` / 새 파일: `ArticleActions.tsx`

#### 필터 연결팀
- **카테고리 필터 동작**: `useSearchParams()`로 URL 읽기, TODAYS_ARTICLES 필터링
- **stats bar 동적**: "23 articles" 하드코딩 → 실제 필터링된 기사 수
- **빈 상태 UI**: "No articles found in this category"
- **Trending 기간 필터**: MOCK_NOW 기준 today/week/month 시간 필터링
- **사이드바 기사 수 뱃지**: 카테고리별 count 원형 뱃지 표시
- 수정 파일: `page.tsx`, `trending/page.tsx`, `Sidebar.tsx`, `mock-data.ts`

#### 뉴스레터 + 유저메뉴팀
- **뉴스레터 구독 API 연결**: `fetch("/api/newsletter/subscribe")`, 로딩/에러 처리
- **유저 메뉴 드롭다운**: 아바타 클릭 → Guest 정보 + Profile/Settings/Sign Out
- **framer-motion 애니메이션**: scale + opacity 0.15초 전환
- **외부 클릭/ESC 닫기**
- 수정 파일: `newsletter/page.tsx`, `Header.tsx` / 새 파일: `UserMenu.tsx`

#### 토스트 UI팀
- **ToastContainer**: 우하단 고정, 타입별 색상 (success/error/info)
- **framer-motion**: 슬라이드-인/아웃 AnimatePresence
- **layout.tsx 연결**: ToastProvider 감싸기 + ToastContainer 추가
- 수정 파일: `layout.tsx` / 새 파일: `ToastContainer.tsx`

---

## 전체 변경 파일 목록

### 새로 생성된 파일 (15개)
```
src/components/SearchModal.tsx         — Command Palette 검색 모달
src/components/SidebarToggle.tsx       — 사이드바 토글 버튼
src/components/SavedGrid.tsx           — Saved 페이지 애니메이션 그리드
src/components/ArticleActions.tsx      — 기사 상세 하단 액션 버튼
src/components/UserMenu.tsx            — 유저 드롭다운 메뉴
src/components/ToastContainer.tsx      — 토스트 알림 UI
src/components/skeletons/NewsCardSkeleton.tsx
src/components/skeletons/AIModelCardSkeleton.tsx
src/lib/hooks/useBookmarks.ts          — 북마크 상태 관리
src/lib/hooks/useShare.ts             — 공유 기능
src/lib/hooks/useToast.ts             — 토스트 Context
middleware.ts                          — 보호 라우트 리디렉션
.env.example                          — 환경변수 템플릿
```

### 수정된 파일 (20개+)
```
next.config.ts                         — 이미지 remotePatterns, 보안 헤더
src/app/(dashboard)/layout.tsx         — 사이드바 상태, ToastProvider
src/app/(dashboard)/page.tsx           — 카테고리 필터, AnimatePresence, stagger
src/app/(dashboard)/trending/page.tsx  — 기간 필터, stagger, next/image
src/app/(dashboard)/saved/page.tsx     — 서버 컴포넌트 전환, SavedGrid 분리
src/app/(dashboard)/newsletter/page.tsx — API 연결, AnimatePresence
src/app/(dashboard)/article/[id]/page.tsx — notFound(), next/image, ArticleActions
src/components/Header.tsx              — SearchModal, UserMenu, 반응형
src/components/Sidebar.tsx             — 접기/펼치기, 오버레이, 기사 수 뱃지
src/components/NewsCard.tsx            — 북마크/공유 동작, next/image
src/lib/security.ts                    — CSRF 강화, safeParseBody
src/lib/env.ts                         — lazy getter 패턴
src/lib/constants.ts                   — Search 카테고리 추가
src/lib/mock-data.ts                   — MOCK_NOW export
src/lib/supabase/client.ts             — env 객체 사용
src/lib/supabase/server.ts             — env 객체 사용
src/lib/supabase/middleware.ts         — env 객체, user 반환
src/app/api/articles/route.ts          — rate limiting, Cache-Control
src/app/api/ai-models/route.ts         — rate limiting, Zod enum 수정, Cache-Control
src/app/api/bookmarks/route.ts         — safeParseBody, GET rate limiting, Cache-Control
src/app/api/newsletter/subscribe/route.ts — safeParseBody, Cache-Control
```

### 추가된 의존성
```
framer-motion — 애니메이션 라이브러리
```

---

## 미구현 기능 현황 (11개 중 8개 해결)

| # | 기능 | 상태 |
|---|------|------|
| 1 | 검색 기능 | ✅ Command Palette (Cmd+K) |
| 2 | 북마크 버튼 | ✅ localStorage + 아이콘 전환 + 토스트 |
| 3 | 공유 버튼 | ✅ Web Share API + 클립보드 폴백 |
| 4 | 기사 상세 Save/Share | ✅ ArticleActions 컴포넌트 |
| 5 | 카테고리 필터 | ✅ URL 파라미터 + 데이터 필터링 |
| 6 | 트렌딩 기간 필터 | ✅ publishedAt 기준 시간 필터 |
| 7 | 뉴스레터 구독 | ✅ API 호출 + 로딩/에러 처리 |
| 8 | 유저 메뉴 | ✅ 드롭다운 + 애니메이션 |
| 9 | 알림 벨 | ❌ 다음 작업 |
| 10 | "See All Models" 페이지 | ❌ 다음 작업 |
| 11 | "Read" 뉴스레터 페이지 | ❌ 다음 작업 |

---

## 향후 권장 사항

| 우선순위 | 항목 |
|---------|------|
| 높음 | Rate limiter를 Upstash Redis로 교체 (서버리스 대응) |
| 높음 | Supabase DB 연동 (mock 데이터 → 실제 데이터) |
| 높음 | Supabase Auth 연동 (Google OAuth) |
| 중간 | 알림 시스템 구현 |
| 중간 | "See All Models" 전용 페이지 |
| 중간 | 대시보드 서버/클라이언트 컴포넌트 분리 (번들 최적화) |
| 낮음 | 라이트/다크 테마 토글 |
| 낮음 | CSP unsafe-inline 제거 (nonce 기반) |
| 낮음 | Python 크롤러 + Claude API 요약 파이프라인 연동 |
