# Worklog — Google 로그인 + 사용자별 북마크 + 사이드바/카드 UI

- 날짜: 2026-06-08
- 작업 범위: 인증(Google OAuth) 완성, 사용자별 저장(북마크) 버그 수정, 사이드바/헤더/기사 카드 UI 개선
- 참고: 본 레포는 여러 Claude가 같은 워킹트리에서 동시 작업 중이라, 아래 파일 목록에 적힌 것만 이 세션에서 변경했다. 다른 작업(models 페이지, ModelCard/ModelDetailModal, transforms 등)은 건드리지 않았다.

---

## 영역 1. Google 로그인 + 사용자별 북마크

### 무엇을 / 왜
- **로그인 진입 경로가 없었다.** 인증 하부구조(useAuth, AuthProvider, lib/auth.ts의 `signInWithGoogle`/`signOut`, Supabase client/server, bookmarks 테이블 + RLS)는 이미 깔려 있었으나, 실제로 로그인할 UI와 OAuth 콜백이 없어 아무도 로그인할 수 없었다.
  - `src/app/auth/callback/route.ts` 신규: Supabase가 돌려준 `?code`를 `exchangeCodeForSession`으로 세션 쿠키로 교환 후 앱으로 복귀(open-redirect 가드 포함).
  - `src/components/UserMenu.tsx` 재작성: 비로그인 시 "Sign in"(Google OAuth 시작), 로그인 시 아바타/이메일 + Saved 바로가기 + Sign Out. 기존엔 "Guest" 하드코딩 목업이었다.

- **북마크 저장이 dev에서 전부 실패했다(핵심 버그).** `verifyOrigin`이 `NEXT_PUBLIC_SITE_URL` 미설정 시 `http://localhost:3000`을 기대했는데 실제 dev는 `:3003` → 모든 북마크 POST/DELETE가 403 차단. 토스트만 뜨고 실제 저장은 안 돼 아이콘이 롤백되고 /saved에도 안 떴다.
  - `src/lib/security.ts`: `verifyOrigin`을 **실제 요청 Host(x-forwarded-host → host)와 비교**하도록 수정. 포트/도메인 무관하게 동작하며 cross-origin은 계속 차단. `NEXT_PUBLIC_SITE_URL`은 폴백으로만 사용. (검증: 동일 출처→통과(401, 쿠키 없을 때), 외부 출처→403)
  - 같은 원인으로 막혀 있던 newsletter 구독도 함께 정상화됨.

- **로그아웃 상태에서 /saved가 보호되지 않았다.** `middleware.ts`가 루트에 있었는데, `src/app` 구조에서는 Next.js가 `src/middleware.ts`만 인식 → 미들웨어가 통째로 무시되어 보호·세션 갱신이 동작하지 않았다.
  - `middleware.ts` → `src/middleware.ts`로 이동(내용 동일, `/saved` 보호 + 세션 갱신).

### 바꾼 파일
- `src/components/UserMenu.tsx` (재작성)
- `src/app/auth/callback/route.ts` (신규)
- `src/middleware.ts` (신규 위치) / 루트 `middleware.ts` (삭제)
- `src/lib/security.ts` (verifyOrigin)

---

## 영역 2. 사이드바 / 헤더 / 기사 카드 UI

### 무엇을 / 왜
- **사이드바 카테고리 아이콘 색이 항상 켜져 있어 산만**했다 → 기본은 글자색(text-secondary), hover/active 시에만 카테고리 색(CSS 변수 `--cat-color`). 카운트 배지도 동일 규칙으로 통일.
- **"전체(all)" 카테고리 항목 추가.** 기존엔 `ai-ml`이 전체(63건)를 보여주는 혼란이 있었다. `all` 항목을 추가해 전체/AI·ML(24건)을 분리. (`types.ts`의 `Category.slug`에 `"all"` 허용, `useArticles` 필터 기준 `ai-ml`→`all`, Sidebar 기본 활성 `all`)
- **NEW 신선도 표시(6시간).** counts API가 최근 6시간 내 발행/수집 글을 카테고리별 집계 → 새 글 있는 카테고리에 펄스 점 표시. (현재 데이터는 6/4 크롤링이라 표시 없음이 정상; 새 크롤링 시 자동 표시)
- **active accent bar**(선택 카테고리 좌측 세로 컬러 바)와 **아이콘/이름 간격**(`gap-3`, `pl-3.5`) 추가.
- **헤더 우측 그룹(검색·알림·프로필)** 이 너무 오른쪽에 붙어 있어 패딩으로 왼쪽 이동(`pr-16/28/40`).
- **기사 상세의 액션 버튼(Save/Share/Original Source)** 이 맨 아래라 쓰기 불편 → 제목·출처 바로 아래(본문 위)로 이동. 구분선을 하단(`border-b`)으로, 모바일 줄바꿈(`flex-wrap`) 추가.

### 바꾼 파일
- `src/components/Sidebar.tsx`
- `src/lib/types.ts`
- `src/lib/constants.ts` (※ `all` 카테고리 추가분만 — 같은 파일의 `/models` NAV 링크는 다른 Claude 소관이라 이 커밋에 미포함)
- `src/lib/hooks/useArticles.ts`
- `src/lib/hooks/useCategoryCounts.ts`
- `src/app/api/articles/counts/route.ts`
- `src/components/Header.tsx`
- `src/components/ArticleActions.tsx`
- `src/app/(dashboard)/article/[id]/page.tsx`

---

## 남은 TODO

- [ ] (사용자) Google Cloud OAuth 클라이언트 발급 + Supabase Authentication > Providers > Google 활성화, Redirect URLs에 `http://localhost:3003/auth/callback` 등록.
- [ ] (검증) dev 서버 재시작 후: ① 로그인 → 북마크 저장 시 아이콘 유지 + /saved 표시 ② 다른 브라우저에서 동기화 ③ 로그아웃 상태 /saved 접근 → 홈 리다이렉트.
- [ ] NEW 표시는 6시간 기준 — 다음 크롤링으로 실제 동작 확인.
- [ ] `constants.ts`의 `/models` NAV 링크는 다른 Claude의 models 작업 소관(미커밋 상태로 작업트리에 보존).
- [ ] (이전 논의) 뉴스레터 "과거 이슈"는 메일 발송 기능이 없어 목업 상태 — 숨김/제거 검토 필요(이번 세션 미실행).
