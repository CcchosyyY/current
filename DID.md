# Done

## 보안
- [x] CSRF verifyOrigin 강화 (Origin/Referer 필수 검증)
- [x] safeParseBody 유틸 추가, 모든 POST/DELETE 라우트 적용
- [x] /api/articles rate limiting (60req/min)
- [x] /api/ai-models rate limiting (60req/min)
- [x] /api/bookmarks GET rate limiting
- [x] API Cache-Control 헤더 (articles 60초, ai-models 300초, mutations no-store)
- [x] middleware 보호 라우트 (/saved 미인증 시 리디렉션)
- [x] env.ts lazy getter로 Supabase 클라이언트 non-null assertion 제거
- [x] 보안 헤더 (CSP, HSTS, X-Frame-Options, Referrer-Policy 등)

## 프론트엔드
- [x] 모바일 반응형 전체 대응 (헤더, 사이드바, 그리드, 카드)
- [x] 사이드바 접기/펼치기 (240px ↔ 60px, localStorage 저장)
- [x] 모바일 사이드바 오버레이 (햄버거 메뉴, ESC/외부 클릭 닫기)
- [x] Command Palette 검색 모달 (Cmd+K, 통합 검색, 키보드 네비게이션)
- [x] Framer Motion 애니메이션 (뉴스 토글, 카드 stagger, 필터 layout, 구독 전환)
- [x] 카드 호버 효과 강화 (shadow + translate)
- [x] 스켈레톤 로딩 컴포넌트 (NewsCard, AIModelCard)
- [x] 유저 메뉴 드롭다운 (Guest, Profile/Settings/Sign Out)
- [x] 토스트 알림 시스템 (success/error/info, 3초 자동 제거)

## 기능 연결
- [x] 북마크 버튼 실제 동작 (localStorage, 아이콘 전환, 토스트)
- [x] 공유 버튼 실제 동작 (Web Share API + 클립보드 폴백)
- [x] 기사 상세 Save/Share 동작 (ArticleActions 컴포넌트)
- [x] 카테고리 필터 실제 동작 (URL 파라미터 → 데이터 필터링)
- [x] 트렌딩 기간 필터 실제 동작 (today/week/month 시간 필터)
- [x] 사이드바 카테고리별 기사 수 뱃지
- [x] 뉴스레터 구독 API 연결 (로딩/에러/성공 처리)
- [x] stats bar 동적 기사 수 표시

## 이미지/성능 최적화
- [x] `<img>` → `next/image` 전환 (NewsCard, Trending, Article Detail)
- [x] next.config.ts remotePatterns 설정
- [x] Trending 정렬 useMemo
- [x] Saved 페이지 서버 컴포넌트 전환 ("use client" 제거)

## 접근성
- [x] nav aria-label (Header, Sidebar)
- [x] 뉴스 토글 aria-expanded + aria-controls
- [x] 뉴스레터 이메일 label (sr-only)
- [x] Article not found → notFound() (HTTP 404)

## 버그 수정 (검사팀)
- [x] ai-models Zod 카테고리 enum 불일치 수정 (Critical)
- [x] AI_MODEL_CATEGORIES에 "Search" 탭 누락 추가
- [x] AIModelCardSkeleton 레이아웃 재작성
