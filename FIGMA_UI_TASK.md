# 작업: Current UI를 아토믹 디자인 기반으로 Figma에 전부 구축

> 이 문서는 Claude Code에게 그대로 넘겨 실행시킬 수 있는 작업 프롬프트다.
> 새 세션에서 시작할 경우 이 파일 경로를 알려주고 "이 작업을 Phase 0부터 시작해줘"라고 지시하면 된다.

## 컨텍스트
- Figma 파일: https://www.figma.com/design/SwGySWU706nVMABEEK65hC  (fileKey: `SwGySWU706nVMABEEK65hC`)
- 이 파일엔 이미 메인 대시보드 프레임 "Dashboard / Desktop"(node `2:2`)이 그려져 있다. **이 프레임을 캔버스의 기준점**으로 삼고, **그 왼쪽 공간(음수 X 방향)에 컴포넌트 라이브러리를 아토믹 레벨별 세로 섹션으로 쌓아** 같은 페이지에 구축한다. (Atoms → Molecules → Organisms → Templates → Pages 순으로 왼쪽에서 오른쪽 흐름)
- 코드 위치: `/home/chosangyun/current` (Next.js 16 + React 19 + Tailwind 4, 패키지매니저 npm)
- 디자인 시스템: Zinc 다크 + Blue 액센트. 컬러 HEX는 `src/lib/constants.ts`의 CATEGORIES/AI_MODELS와 메모리 컬러표를 사용. 폰트는 헤딩/영문 = Nunito, 한글 = Noto Sans KR.

## 절대 규칙
1. `use_figma` 호출 전 반드시 `figma-use` 스킬을, 컴포넌트 생성 시 `figma-generate-library` 스킬을, 페이지 조립 시 `figma-generate-design` 스킬을 MCP 리소스로 먼저 로드한다(`skillNames`에 `resource:` 접두사).
2. **색·간격·radius·타이포는 하드코딩 금지.** 먼저 Figma Variables(토큰)를 만들고 모든 노드는 `setBoundVariable`/스타일로 토큰을 바인딩한다.
3. atom은 **Figma Component + Variant**로 만들고, 상위 레벨은 **반드시 인스턴스로 조합**한다(다시 그리지 말 것).
4. 한 `use_figma` 호출은 10 logical operation 이하. 섹션/컴포넌트 단위로 잘게 나누고, 매 단계 후 `get_screenshot`으로 검증한 뒤 진행한다. 에러 시 즉시 재시도 금지 — 메시지 읽고 수정.
5. 브라우저 확인은 **Puppeteer MCP만** 사용(WSL2에서 chrome-devtools MCP 불가).

## 작업 방식: 단계별 순차 진행 (각 Phase 끝에 STOP → 스크린샷 보고 → 승인 후 다음)

### Phase 0 — 코드 점검 & 디자인 토큰
- `src/lib/constants.ts`, `src/lib/types.ts`, `src/components/*.tsx`, 각 `page.tsx`를 모두 읽어 **컴포넌트·페이지 인벤토리를 확정**한다. 아래 인벤토리는 출발점일 뿐, 코드가 진실이다.
- Figma Variables 컬렉션 생성: `color`(bg/border/text/accent + 카테고리 14색 + 모델 브랜드색), `space`, `radius`, 그리고 텍스트 스타일(heading/title/body/caption, Nunito·Noto Sans KR).
- 검증: 컬렉션·변수·스타일 개수 `get_metadata`로 확인. → STOP.

### Phase 1 — Atoms (대시보드 왼쪽 "Atoms" 섹션)
코드에서 확정하되 최소 포함: Logo Mark, Icon(카테고리 컬러 14종), Button(primary/secondary/ghost/icon, 상태 default·hover·disabled), CategoryTag/Pill(컬러 variant), Badge(알림 카운트), Avatar, Input/SearchField, KbdKey(Cmd K), FilterTab(active/inactive), CollapseToggle, Divider, SkeletonBlock, Toast.
- 각각 Component+Variant로 생성, 토큰 바인딩. → 스크린샷 검증 → STOP.

### Phase 2 — Molecules (atoms 인스턴스 조합)
SearchBar, NavItem(active 상태), CategoryNavItem, TabGroup, NewsCard, AIModelCard, ExpertCard, NotificationItem, UserMenuItem. (각 컴포넌트의 실제 props·구조는 해당 `src/components/*.tsx`와 대조.) → 검증 → STOP.

### Phase 3 — Organisms (molecules 인스턴스 조합)
Header, Sidebar(MAIN/MORE 14카테고리), NewsGrid, ModelGrid, SearchModal(Cmd+K), UserMenu 드롭다운, NotificationDropdown(구현예정), ArticleActions, SavedGrid, ToastContainer. → 검증 → STOP.

### Phase 4 — Templates
DashboardShell(Header+Sidebar+Main slot), AuthLayout(로그인용). 기존 `2:2` 대시보드를 organism 인스턴스로 재구성해 일관성 검증. → STOP.

### Phase 5 — Pages (구현된 것 + 구현할 것 전부)
각 페이지마다 순서 고정: ① 해당 코드(있으면) 점검 → ② 템플릿+organism 인스턴스로 Figma 조립 → ③ **구현된 페이지는 `npm run dev`(localhost:3000) 띄워 Puppeteer로 실제 렌더 캡처 후 Figma와 1:1 대조**, 차이 있으면 어느 쪽이 옳은지 판단해 수정 → ④ 스크린샷 보고 → STOP.
- **구현됨:** Dashboard `/`, Trending `/trending`, Saved `/saved`, Newsletter `/newsletter`, Article Detail `/article/[id]`.
- **구현 예정(코드 없음 → Figma가 스펙):** Login(Google OAuth), Profile, Settings, Newsletter 상세(Read), All Models, Error 상태, Loading 상태(skeleton 조합), 알림 드롭다운 열린 상태.

### Phase 6 — 최종 점검
- 모든 페이지가 같은 토큰/컴포넌트 인스턴스를 쓰는지, 끊긴(detached) 인스턴스·하드코딩 색이 없는지 점검.
- 구현 예정 페이지는 "코드 구현 시 참조용 스펙"임을 명시한 요약 표를 남긴다.
- 캔버스 정리: Atoms→Molecules→Organisms→Templates→Pages 순으로 라벨링된 섹션 정렬.

## 2026-06-04 업데이트 (코드 변경 → Figma에 반영 필요)

> 이 항목들은 코드에 이미 반영됐고, 다음 Figma 세션에서 디자인에도 반영해야 한다.
> (Figma 라이브 빌드는 위 Phase 규칙대로 **승인 기반 인터랙티브**로 진행 — 무인 자동 실행하지 않음.)

- **AI 모델 24 → 37개**: `src/lib/constants.ts`에 13개 추가(sora, veo, kling, elevenlabs, manus, genspark, qwen, kimi-k2, ideogram, recraft, glean, cline, higgsfield). Phase 1의 모델 브랜드색 토큰과 Phase 2의 AIModelCard 인스턴스를 37개로 확장. 아이콘은 임시 monogram SVG(`public/icons/models/*.svg`) — 추후 실제 브랜드 로고로 교체 권장.
- **신규 컴포넌트 `ModelCard`(hover 상세 팝오버)**: 모델 타일에 마우스 hover/포커스 시 설명·카테고리·Website/Blog 링크 팝오버가 뜸. Phase 2 Molecule로 "AIModelCard / Hovered" variant 추가 필요.
- **신규 페이지 `/models`(See-All Models)**: 카테고리 필터 + 카테고리별 그룹 그리드. Phase 5 "All Models" 시안을 이 실제 구현과 1:1 대조.
- **폴리시 변경**: 전역 focus-visible 링(globals.css), Toast `aria-live`, Header kbd `⌘K`, newsletter 성공 체크 아이콘(lucide CheckCircle)·`text-error` 토큰. Phase 1/3 atom·organism에 반영.

## 완료 기준
- 왼쪽 컴포넌트 라이브러리(5개 아토믹 섹션) + 오른쪽 페이지 시안(구현 5 + 예정 8) 전부 존재.
- 구현된 5개 페이지는 실제 dev 서버 렌더와 시각적으로 일치 확인 완료.
- 모든 시안이 Variables/Component 인스턴스로 구성(하드코딩·detached 없음).
- 진행 중엔 매 Phase마다 멈춰 스크린샷으로 보고하고 승인받는다.
