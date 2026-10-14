# TODO — Current

> AI 뉴스 수집 + **작업에 맞는 AI 모델 찾기**(OpenRouter 비교) 서비스 (Next.js 16 + Supabase)
> "한 일" → `git log --oneline` · 설계/맥락 → `docs/`
> 완료한 항목은 이 파일에서 **삭제**합니다 (git이 기록함)

---

## 📍 현황 (2026-10-15)

- **방향 전환**: 뉴스 대시보드 → 뉴스 파이프라인 위에 **모델 비교·평가 서비스**를 붙인다
  - 제거: B2 주가 연동·호재/악재, B3 ESP32 하드웨어, 요약·감성 판단(핵심 기능에서 제외)
  - 유지: 기사 수집 → 새 모델 출시 감지의 입력으로 사용
- **설계 완료**: `docs/domain-stories.md`(이야기 7·규칙 R-1~R-28) · `docs/architecture.md`(모듈 9·테이블) · `docs/architecture.puml`+`docs/uml/` · `docs/plan-stage1.md`(S1~S11)
- **비교 1단계: S1~S9 완료** (`feat/compare`, 미머지)
  - 백엔드: DB 7테이블+RLS, OpenRouter 어댑터, 카탈로그 344개, 작업 유형 묶기(판정 AI), 실행·비교·블라인드·한도 API — 실제 HTTP 26항목 검증
  - 화면: 홈 = 뉴스 ↔ 비교 **가로 슬라이드**. 비교는 모델 → 보낼 내용 → 실행, 끝난 모델부터 표시, 블라인드 선택 후 공개 (1·2차 UI)
- **Hot: 구현·커밋 완료** (`feat/hot-news`, 미머지) — 새 모델·긴급 뉴스를 사건 단위로 홈 상단에
- 뉴스: 메인/Trending/Models/Newsletter/Saved, 크롤러 12시간 주기(KST 09/21시), 피드 6곳, 기사 568건+

## ✅ 결정된 것

- 프로젝트 이름 **Current** · 비교는 **로그인 필수** · 크롤러 keepalive **안 함**(60일 커밋 없으면 꺼지게 둠)
- OpenRouter: **서버 키**로 허용 목록 저가 모델 3개(`gpt-5-nano`·`gemini-2.5-flash-lite`·`claude-haiku-5.5`, 운영자 부담), 그 밖은 **개인 키**
- 서버 키 한도: 사용자 **하루 5회** + 서비스 하루 $1 + OpenRouter 키 $5. 반복 측정 하루 1회·샘플 2개까지 (R-26)
- 블라인드: 선택 전 이름·로고·비용 숨김(서버가 안 보냄), **속도는 보임**. 선택지 이게 낫다 / 셋 다 비슷함 / 전부 별로
- 모델 설정: **기본값**(아무것도 안 보냄) + 추론 강도·답변 길이 선택. 한 비교 안은 같은 설정 (R-27)
- 샘플을 그대로 전송(숨은 시스템 프롬프트 없음, R-28) · **작업 이름 칸 없음** → 판정 AI가 샘플로 작업·유형 결정
- 작업 유형: 씨앗 6개 출발점, AI가 묶고 새 유형은 넓은 범주로 늘림 · 순위는 전체+내 순위, 유형별
- 새 모델: 추천만, 실행은 사용자가 직접 · 알림 없음
- 보류: 개인 키 보관 방식 (3단계 전)

---

## 🔥 Now — 지금 (1~3개만)

- [ ] **비교 화면 UI 다듬기** — 2차까지 반영(작업 칸 제거·끝난 모델부터·넓은 칸·크게 보기). 다음 피드백 대기
- [ ] **S10 기록 화면** — 내 비교 목록 / 비교 다시 보기 (`GET /api/comparisons?mine=1`)
- [ ] **S11 검증** — 브라우저 E2E (Playwright Chromium 다운로드가 멈춰 있음 → 다시 시도), 비용 대조, RLS

## ⏭️ Next — 다음

- [ ] **브랜치 합치기**: `feat/hot-news`와 `feat/compare` 둘 다 main 미머지. 홈이 `page.tsx` → `components/home/NewsHome.tsx`로 옮겨져서 Hot 머지 시 `HotSection`을 `NewsHome`에 다시 넣어야 함
- [ ] 결과 본문 마크다운 렌더링 (지금은 줄바꿈만 — `**굵게**`·목록이 그대로 보임)
- [ ] 결과 글자 단위 스트리밍 (지금은 모델별로 끝나면 표시)
- [ ] 비교 2단계: 유형별 전체/내 순위 (`ranking_*` DB 함수, Bradley-Terry 검토) → 추천 모델을 순위 기반으로
- [ ] 비교 3단계: 일관성 측정(반복 하루 1회) + 비용 시뮬레이터 + 개인 키
- [ ] 비교 4단계: Hot `model_release` 사건 ↔ 카탈로그 연결 → "내 작업으로 비교해 보기" (예: `google/gemini-4-argon`)
- [ ] 카탈로그 동기화 하루 1회 자동 (지금 수동: `POST /api/admin/catalog/sync`)
- [ ] 한국어 모델 비교 서비스가 이미 있는지 조사 (차별점 확인)
- [ ] 분류 정확도 점검 / 기존 DB 기사 재분류

## 🧹 정리 — 잡일

- [ ] `middleware` → `proxy` 파일 컨벤션 마이그레이션 (Next.js 16 deprecation 경고)
- [ ] `docs/openrouter-integration.md`(10/13, `feat/openrouter-playground`) 정리 — 새 설계로 대체됨
- [ ] 쓰지 않는 API 정리 여부: `/api/tasks/resolve`, `/api/task-types/suggest` (작업 이름 칸 제거 후 화면에서 안 씀, 내 작업 저장에서 재사용 가능)
- [ ] NEW 신선도 점 기준(6시간) — 크롤 12시간 주기라 대부분 안 붙음. 12시간으로 늘릴지 결정
- [ ] Verge 본문 일부 이모지 깨짐(`ð¤` — 원본 피드의 mojibake)
- [ ] 기사 로고 fallback(모델→회사→사이트)을 Trending·Saved·상세에도 적용

## 💡 Someday — 백로그

**배포**
- [ ] Vercel 배포 (Auth·OpenRouter 콜백 URL도 배포 도메인으로 추가)

**모델 / 회사**
- [ ] `PAGE_FIRST_SLUGS` 전체 모델로 확장 (현재 chatgpt만 파일럿)
- [ ] Try 버튼: 밝은 브랜드색 대비 보정 (글자색 토글)
- [ ] 회사 로고 171→200 보완 + 큰 로고(.ico) 64px 최적화 + berkshire-hathaway 대체
- [ ] 모델→회사 명시 매핑(companySlug) / 회사 상세(시총·창립·본사) 데이터 확장

**페이지 / 기능**
- [ ] Newsletter 상세("Read") 페이지
- [ ] Profile / Settings 페이지, 알림 벨(드롭다운)
- [ ] 페이지별 SEO 메타데이터(generateMetadata)
- [ ] 대시보드 서버/클라이언트 컴포넌트 분리 (번들 최적화)
- [ ] 크롤러 Claude API 기사 요약 (현재 RSS snippet 그대로 사용)

**Trending 페이지 개편** (현재: `view_count` 내림차순 정렬 + 기간 클라 필터뿐)
- [ ] 실제 조회수 추적 — 기사 열람 시 `view_count` +1 (RPC/API). 현재는 크롤마다 합성값 재계산 (`crawl-articles.mjs:638-649`)
- [ ] `is_trending` 실제화 — 크롤러 합성 플래그 → 조회수 + 최신성 신호 기반으로
- [ ] UI/UX 개선 — 순위 변동(▲▼) 실제 데이터화(지금은 isTrending→고정 ↗/−), 1~3위 강조, 빈상태·스켈레톤 다듬기, 모바일 레이아웃
- [ ] 기간 필터 서버화 — 현재 마운트 시점 `Date.now()` 기준 클라 필터(부정확) → 쿼리로 이관

**폴리싱 / 인프라**
- [ ] Nunito 한글 폴백(Noto Sans KR), 사이드바 반응형, 라이트/다크 토글
- [ ] CSP unsafe-inline/eval 제거(nonce 기반), 페이지 전환 애니메이션
- [ ] Rate limiter 인메모리 → Upstash Redis
- [ ] E2E 테스트(Playwright)

**Figma 디자인 시스템** (파일 `SwGySWU706nVMABEEK65hC`)
- [ ] 모델 모달 시안(node 46:2) 다듬기 → 코드 / 5개 페이지 컴포넌트 인스턴스화
- [ ] 화면 fill을 Color 변수 바인딩 / 모바일 프레임 / 아이콘 동기화 유지

**먼 미래**
- [ ] 대시보드 위젯 드래그 커스터마이징 / PWA / i18n
