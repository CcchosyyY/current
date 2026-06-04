# TODO — Current by Jyos

> AI 뉴스 큐레이션 플랫폼 (Next.js 16 + Supabase)
> Last updated: 2026-06-04

---

## ✅ 데이터 복구 (2026-06-04 완료)

> Supabase `zlpdtswbgteufzszjigy` 재가동 → 코드 정합 스키마 재구축 + 기사 63건 크롤링 적재

- [x] Supabase 프로젝트 복구 + 코드 정합 스키마 적용(`schema.sql` 동기화) + `.env.local` 갱신
- [x] DB 카테고리 seed를 코드 14개와 일치 (ai_models 24개도 정합, `ai_models.slug` 추가)
- [x] RSS 크롤러(`scripts/crawl-articles.mjs`)로 6개 피드 크롤링 → 기사 63건 적재, 클릭→상세 동작 검증

---

## ✅ 코드 점검 · UI · 신규 모델 · 보안 (2026-06-04)

> 멀티에이전트 감사(코드/보안/UI/분류) + 트렌드 리서치 → 구현 → 적대적 리뷰 후 수정

- [x] **AI 모델 24 → 37개**: 2025–26 트렌드 모델 13개 추가(Sora, Veo, Kling, ElevenLabs, Manus, Genspark, Qwen, Kimi K2, Ideogram, Recraft, Glean, Cline, Higgsfield) + monogram 아이콘 + DB/스키마 시드
- [x] **모델 hover 상세 모달**(`ModelCard`): 설명·카테고리·Website/Blog 링크. portal+fixed 위치(클리핑 방지)·키보드 접근성
- [x] **"See All Models" `/models` 페이지** 신규 (카테고리 필터)
- [x] **기사 분류 정확도 개선**: 부분일치 오탐 제거(coding 16→4), intent 우선순위, 신규 모델 트리거, 재크롤
- [x] **보안 수정**: `.or()` 검색 인젝션 차단, 이미지 `**` 와일드카드 → CDN 허용목록(SSRF 차단), 크롤러 anon 쓰기 가드, 기사 ID UUID 검증
- [x] **정확성 수정**: 미존재 카테고리 빈 결과, bookmarks 모델 slug, 배열 가드, 트렌딩 NaN/기본기간
- [x] **UI 정리**: 전역 focus-visible 링, Toast aria-live, 토큰 위반 수정, Header ⌘/Ctrl 분기, 죽은 코드 제거

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
- [x] "See All Models" 전용 페이지 (`/models`)
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

- [~] RSS 크롤러 완료(`scripts/crawl-articles.mjs`, Node). 남은 것: Claude API 요약 + service_role 키로 자동 실행
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
