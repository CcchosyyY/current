# TODO — Current by Jyos

> AI 뉴스 큐레이션 플랫폼 (Next.js 16 + Supabase)
> Last updated: 2026-03-27

---

## Phase 1: MVP UI ✅

- [x] 대시보드 레이아웃 (Header + Sidebar + Main)
- [x] 카테고리 14개 구조 (Core 7 + Extended 7) 및 컬러 아이콘
- [x] 사이드바 리디자인 (Main/More 그룹, 카테고리별 active 색상)
- [x] AI Models 그리드 (24개 모델 카드)
- [x] 폰트 변경 (Nunito + Nunito Sans — 둥근 느낌)
- [x] 아티클 카드 텍스트 축소 (가독성 개선)
- [x] 다크 테마 기본 적용

---

## Phase 2: 데이터 & 백엔드

> 목표: mock 데이터 탈피 → Supabase 실데이터 연동

- [ ] 14개 카테고리 전체에 대한 mock 기사 데이터 보충 (현재 llm/ai-ml만 존재)
- [ ] Supabase DB 연동 — mock 데이터를 실제 데이터로 교체
- [ ] 북마크를 Supabase API와 연결 (localStorage → DB)
- [ ] 검색 기능 Supabase 연동 (DB 전문 검색)
- [ ] Rate limiter를 Upstash Redis로 교체 (인메모리 → 서버리스 대응)

---

## Phase 3: 인증 & 사용자

> 목표: Google OAuth 로그인 → 개인화

- [ ] Supabase Auth 연동 (Google OAuth 로그인/로그아웃)
- [ ] 유저 메뉴 Profile / Settings 페이지 구현
- [ ] 알림 벨 기능 구현 (알림 시스템 + 드롭다운)

---

## Phase 4: 페이지 & 기능 완성

> 목표: 빈 페이지 채우기 + UX 개선

- [ ] "Read" 뉴스레터 상세 페이지 생성
- [ ] "See All Models" 전용 페이지 생성
- [ ] 대시보드 서버/클라이언트 컴포넌트 분리 (번들 최적화)
- [ ] 에러 바운더리 (error.tsx) 추가
- [ ] 로딩 UI (loading.tsx) 추가
- [ ] SEO 메타데이터 페이지별 설정 (generateMetadata)

---

## Phase 5: 폴리싱 & 반응형

> 목표: 디테일 다듬기

- [ ] Nunito 한글 폴백 추가 (Noto Sans KR — 현재 Korean 글리프 누락)
- [ ] 사이드바 반응형 튜닝 (220px 기준, 태블릿/중간 화면 대응)
- [ ] CSP에서 unsafe-inline/unsafe-eval 제거 (nonce 기반 전환)
- [ ] 라이트/다크 테마 토글
- [ ] 페이지 전환 애니메이션 (Framer Motion 활용)

---

## Phase 6: 자동화 & 배포

> 목표: 실제 서비스로 전환

- [ ] Python 크롤러 + Claude API 요약 파이프라인 연동
- [ ] Vercel 배포 설정
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] E2E 테스트 (Playwright)

---

## Backlog

- [ ] 대시보드 위젯 드래그 커스터마이징
- [ ] PWA 지원 (manifest.json, service worker)
- [ ] 다국어 지원 (i18n)
