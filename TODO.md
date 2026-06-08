# TODO — Current by Jyos

> AI 뉴스 큐레이션 플랫폼 (Next.js 16 + Supabase)
> Last updated: 2026-06-08
> 완료 항목은 `DID.md` 참조

---

## Phase: 모델 모달 & 페이지

- [ ] 모델 상세 모달 Figma 상세 다듬기 → 코드 재반영 (현재 localhost 러프 단계)
- [ ] `PAGE_FIRST_SLUGS` 전체 모델로 확장 (현재 `chatgpt`만 파일럿) — UX 확정 후
- [ ] Try 버튼: 밝은 브랜드색(노랑 등) 모델은 흰 글자 대비 보정 (대비 계산 후 글자색 토글)
- [ ] 회사 로고 200개까지 보완 (현재 171) + `berkshire-hathaway` 로고 누락 대체
- [ ] 큰 로고 최적화 (goldman 280KB·deepseek 208KB 등 `.ico` → 64px 리사이즈)
- [ ] 기사 로고 fallback(모델→회사→사이트) Trending·Saved·기사 상세에도 적용
- [ ] 모델→회사 명시 매핑(`companySlug`) — 현재는 회사명 문자열 매칭
- [ ] 회사 상세(시총/창립/본사) 데이터 확장 — 현재 주요 18곳만

## Phase: 데이터 & 백엔드

- [ ] 검색 Supabase 전문 검색 연동 (현재 title/summary ilike)
- [ ] Rate limiter 인메모리 → Upstash Redis

## Phase: 인증 & 사용자

- [ ] (사용자) 실제 로그인→북마크 저장→/saved 표시 end-to-end 1회 확인
- [ ] Profile / Settings 페이지
- [ ] 알림 벨 (드롭다운)

## Phase: 페이지 & 기능 완성

- [ ] Newsletter 상세("Read") 페이지
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

- [~] RSS 크롤러(`scripts/crawl-articles.mjs`): 소스 6곳·AI 스코프 필터·태깅 정밀화 완료(dry-run). 남은 것:
  - [ ] service_role 키로 실제 DB 반영 (현재 DB는 6/4 데이터 — 다음 크롤부터 적용)
  - [ ] 기존 DB 기사 백필 (옛 분류/옛 소스 재분류)
  - [ ] LLM(Claude Haiku) 분류 도입 — 키워드로 못 거르는 비즈니스 기사 누출 해결
  - [ ] Claude API 요약 + 자동 실행(Cron)
- [ ] Vercel 배포 + Cron Job
- [ ] CI/CD (GitHub Actions)
- [ ] E2E 테스트 (Playwright)

## Figma / 디자인 시스템

> 파일: `SwGySWU706nVMABEEK65hC`

- [ ] 모델 상세 모달 시안(node `46:2`) 상세 다듬기 → 코드 반영
- [ ] 5개 페이지 요소를 컴포넌트 인스턴스로 연결 (현재는 시각만 동일)
- [ ] 화면 fill을 `Color` 변수에 바인딩 (테마 전환 대비)
- [ ] 모바일 반응형 프레임 추가
- [ ] 사이드바 아이콘 lucide-react ↔ Figma 동기화 유지

---

## Backlog

- [ ] 대시보드 위젯 드래그 커스터마이징
- [ ] PWA 지원 (manifest.json, service worker)
- [ ] 다국어 지원 (i18n)
