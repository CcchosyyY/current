# TODO — Current by Jyos

> AI 뉴스 큐레이션 플랫폼 (Next.js 16 + Supabase)
> Last updated: 2026-06-04

---

## 🔴 최우선 — 데이터 복구

> `.env.local`의 Supabase 프로젝트가 DNS 미해석(삭제/중지) → 라이브 앱에 데이터가 안 뜸

- [ ] 새 Supabase 프로젝트 생성 + `src/lib/supabase/schema.sql` 적용 + `.env.local` 갱신
- [ ] DB 카테고리 seed를 코드 14개와 일치 (현재 schema seed는 8개)
- [ ] 14개 카테고리 실데이터/mock 시드로 채우기

---

## Phase: 데이터 & 백엔드

- [ ] 북마크 localStorage → Supabase API 연결
- [ ] 검색 Supabase 전문 검색 연동
- [ ] Rate limiter 인메모리 → Upstash Redis

## Phase: 인증 & 사용자

- [ ] Supabase Auth Google OAuth 로그인/로그아웃
- [ ] Profile / Settings 페이지
- [ ] 알림 벨 (드롭다운)

## Phase: 페이지 & 기능 완성

- [ ] Newsletter 상세("Read") 페이지
- [ ] "See All Models" 전용 페이지
- [ ] 대시보드 서버/클라이언트 컴포넌트 분리 (번들 최적화)
- [ ] error.tsx / loading.tsx 추가
- [ ] 페이지별 SEO 메타데이터 (generateMetadata)

## Phase: 폴리싱 & 반응형

- [ ] Nunito 한글 폴백(Noto Sans KR) — 코드 적용
- [ ] 사이드바 반응형 튜닝 (태블릿/중간 화면)
- [ ] 라이트/다크 테마 토글
- [ ] CSP unsafe-inline/eval 제거 (nonce 기반)
- [ ] 페이지 전환 애니메이션

## Phase: 자동화 & 배포

- [ ] Python RSS 크롤러 + Claude API 요약 파이프라인 (Supabase 복구 후)
- [ ] Vercel 배포 + Cron Job
- [ ] CI/CD (GitHub Actions)
- [ ] E2E 테스트 (Playwright)

## Figma / 디자인 시스템

> 파일: `SwGySWU706nVMABEEK65hC`

- [ ] 5개 페이지 요소를 컴포넌트 인스턴스로 연결 (현재는 시각만 동일)
- [ ] 화면 fill을 `Color` 변수에 바인딩 (테마 전환 대비)
- [ ] 모바일 반응형 프레임 추가
- [ ] 사이드바 아이콘 lucide-react ↔ Figma 동기화 유지

---

## Backlog

- [ ] 대시보드 위젯 드래그 커스터마이징
- [ ] PWA 지원 (manifest.json, service worker)
- [ ] 다국어 지원 (i18n)
