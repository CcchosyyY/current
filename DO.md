# TODO — Current

> AI 뉴스 수집 + **작업에 맞는 AI 모델 찾기**(OpenRouter 비교) 서비스 (Next.js 16 + Supabase)
> "한 일" → `git log --oneline` · 설계/맥락 → `docs/`
> 완료한 항목은 이 파일에서 **삭제**합니다 (git이 기록함)

---

## 📍 현황 (2026-10-15)

- **방향 전환**: 뉴스 대시보드 → 뉴스 파이프라인 위에 **모델 비교·평가 서비스**를 붙인다
  - 제거: B2 주가 연동·호재/악재, B3 ESP32 하드웨어, 요약·감성 판단(핵심 기능에서 제외)
  - 유지: 기사 수집 → 새 모델 출시 감지의 입력으로 사용
- **뉴스 대시보드: ~완성** — 메인/Trending/Models(37개)/Newsletter/Saved, Google 로그인+북마크, 크롤러(키워드+Haiku 분류)
- **Hot: 구현·커밋 완료** (`feat/hot-news`, 미머지) — 새 모델 출시·긴급 뉴스를 사건 단위로 홈 상단에 표시
- DB 기사 568건+, 크롤러 12시간 주기(KST 09/21시), 피드 6곳

## ✅ 결정된 것

- 프로젝트 이름: **Current**
- OpenRouter 키: **서버 키로 저가 모델 3개(GPT·Gemini·Claude, 운영자 부담, 하루 5회)**, 그 밖의 모델은 **사용자 각자 결제한 키**로
- 설계 문서: `docs/domain-stories.md`, `docs/architecture.md`, `docs/architecture.puml`(+ `docs/uml/*.png`)
- 비교 서비스는 **로그인 필요** (사용자별 선호 순위·실행 기록)
- 크롤러 keepalive는 **하지 않음** — 60일 커밋 없으면 GitHub이 크롤러를 끄도록 둔다
- `docs/openrouter-integration.md`(10/13, `feat/openrouter-playground`)는 "사용자 키만·로그인 없음" 전제라 위 결정과 다름 → 아키텍처 확정 후 다시 씀

---

## 🔥 Now — 지금 (1~3개만)

- [ ] **0-4 비교 1단계 화면·API 세부 계획** (도메인 스토리·아키텍처 v1 작성 완료, Q-1~Q-5 결정)

## ⏭️ Next — 다음

- [ ] 저장소 구조 정리 → 재사용/제거/신규 구분 → **실행 기록 테이블 설계** → 비교 1단계 구현 계획
- [ ] 비교 1단계: 여러 모델 결과 나란히 + 비용·속도, 이름 가리기, 순서 섞기, 선택 저장
- [ ] 비교 2단계 순위 → 3단계 일관성·비용 시뮬레이터 → 4단계 Hot(model_release) 연결 자동 재평가 → 5단계 라우팅(보류)
- [ ] 한국어 모델 비교 서비스가 이미 있는지 조사 (차별점 확인)
- [ ] 분류 정확도 점검 / 기존 DB 기사 재분류
- [ ] 기사 로고 fallback(모델→회사→사이트)을 Trending·Saved·상세에도 적용

## 🧹 정리 — 잡일

- [ ] `middleware` → `proxy` 파일 컨벤션 마이그레이션 (Next.js 16 deprecation 경고)
- [ ] `package-lock.json` 미커밋 변경(13줄 삭제) 확인 후 커밋/폐기 — `"peer": true` 플래그만 빠진 npm 버전 차이
- [ ] NEW 신선도 점 기준(6시간) — 크롤 12시간 주기라 대부분 안 붙음. 12시간으로 늘릴지 결정
- [ ] Verge 본문 일부 이모지 깨짐(`ð¤` — 원본 피드의 mojibake)
- [ ] GitHub Actions `checkout@v4`·`setup-node@v4` 버전 점검 (Node 20 제거 9/16 이후에도 10/9 실행 정상)

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
