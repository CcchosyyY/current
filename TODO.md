# TODO

## 높음
- [ ] Rate limiter를 Upstash Redis로 교체 (인메모리 → 서버리스 대응)
- [ ] Supabase DB 연동 (mock 데이터 → 실제 데이터)
- [ ] Supabase Auth 연동 (Google OAuth 로그인/로그아웃)
- [ ] 북마크를 Supabase API와 연결 (현재 localStorage → DB)
- [ ] CSP에서 unsafe-inline/unsafe-eval 제거 (nonce 기반 전환)

## 중간
- [ ] 알림 벨 기능 구현 (알림 시스템 + 드롭다운)
- [ ] "See All Models" 전용 페이지 생성
- [ ] "Read" 뉴스레터 상세 페이지 생성
- [ ] 대시보드 서버/클라이언트 컴포넌트 분리 (번들 최적화)
- [ ] 검색 기능 Supabase 연동 (현재 mock 데이터 검색 → DB 전문 검색)
- [ ] 유저 메뉴 Profile/Settings 페이지 구현
- [ ] 에러 바운더리 (error.tsx) 추가
- [ ] 로딩 UI (loading.tsx) 추가
- [ ] SEO 메타데이터 페이지별 설정 (generateMetadata)

## 낮음
- [ ] 라이트/다크 테마 토글
- [ ] 페이지 전환 애니메이션 (Next.js + Framer Motion)
- [ ] 대시보드 위젯 드래그 커스터마이징
- [ ] PWA 지원 (manifest.json, service worker)
- [ ] Python 크롤러 + Claude API 요약 파이프라인 연동
- [ ] 다국어 지원 (i18n)
- [ ] E2E 테스트 (Playwright)
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] Vercel 배포 설정
