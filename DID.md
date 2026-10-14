# Done

> **블로그 발행 대기 버퍼** — 직전 1개 세션 섹션만 유지하고, 블로그 발행 후 비웁니다.
> 영구 기록: `git log --oneline`(한 일) · `docs/`(설계·왜/어떻게)
> 이전 세션(2026-10-10 휴면 복구·백필·이미지) 섹션은 커밋 `b2c4d51`의 DID.md에 있습니다.

## 2026-10-15 — 방향 전환: 뉴스 위에 모델 비교 서비스 · Hot · 설계 문서 · 비교 1단계(S1~S9)

> 주가 연동·ESP32를 접고, "내 작업에 맞는 AI 모델을 찾는" 비교 서비스를 뉴스 파이프라인 위에 붙이기로 했다.
> 기능부터 만들지 않고 **도메인 스토리 → 아키텍처 → 계획**을 먼저 확정한 뒤 구현했다.

### 완료 항목
- **Hot** (`feat/hot-news`): 크롤러에 분류와 별개인 Hot 판정 단계(Haiku, temperature 0) — 새 모델 / 긴급(장애·종료·가격·인수합병·오작동·보안 사고·약관 변경). 같은 사건 기사는 **사건 키**로 묶어 카드 하나로. 노출 기간은 첫 기사 기준 새 모델 72h · 긴급 48h. 홈 상단 Hot 섹션.
- **설계 문서**: `docs/domain-stories.md`(이야기 7·용어집·규칙 R-1~R-28·결정 기록), `docs/architecture.md`(모듈 9·의존 규칙·의미 묶기 패턴·테이블·API·보안), UML 7개(`docs/architecture.puml` + `docs/uml/*.png`), `docs/plan-stage1.md`(S1~S11).
- **S1 DB**: 비교 테이블 7개(`catalog_models`·`task_types`·`tasks`·`samples`·`comparisons`·`runs`·`choices`) + RLS + 씨앗(유형 6개·허용 모델 3개).
- **S2·S3**: 서버 전용 환경변수(`server-only`), 관리자 DB 클라이언트, 공통 에러 형식, OpenRouter 어댑터(실제 비용·공급사·생각 토큰·실패 분류).
- **S4 카탈로그**: OpenRouter 462개 중 비교 대상 344개 동기화(별칭·배치·라우터 제외), 브랜드 연결.
- **S5 작업 유형 묶기**: 판정 AI가 기존 유형 재사용 우선, 새 유형은 넓은 범주로("SQL 쿼리 짜줘" → 코드 작성). 자동완성 DB 함수.
- **S6~S8 비교 API**: 실행(병렬·행마다 1회 완료·실패도 비용 기록), 비교(만들기·실행·선택·공개·24h 방치), 블라인드(`blind.ts` 하나로만 화면 값 생성), 한도(하루 5회·서비스 $1), 임시 추천.
- **S9 화면**: 홈 = 뉴스 ↔ 비교 **가로 슬라이드**(세로 풀페이지 스냅은 시험 후 기각). 비교 화면에선 카테고리 사이드바 숨김. 작업 이름 칸 없이 판정 AI가 샘플로 작업·유형 결정. 끝난 모델부터 표시, 결과 나오면 입력 접기, 넓고 긴 결과 칸, 크게 보기.

### 검증 (2026-10-15, dev :3003)
- OpenRouter 실측: 기본 3모델 정상, `max_tokens` 작으면 GPT-5 nano가 생각에 다 써서 **빈 답**(→ 기본값은 아무 설정도 안 보냄), Claude 공급사가 호출마다 다름(Azure/AWS), 응답 `model`엔 버전 없음(→ 카탈로그 `canonical_slug` 함께 기록).
- 비교 API: 테스트 사용자 2명으로 실제 로그인·HTTP·모델 호출 **26항목 통과** — 선택 전 응답에 모델 키 자체 없음, 사용자 토큰으로 Supabase 직접 조회 빈 결과, 동시 실행 한 번만, 남의 비교 404, 6번째 비교 429, 실행 기록 전 컬럼 채워짐. 비용 $0.0016.
- 끝난 모델부터 표시: B·C 3.7초, A 10.8초에 채워짐(블라인드 유지).
- 작업 유형: 자소서/이메일 → 문장 교정, 저녁 메뉴 → 새 유형 레시피 추천, "안녕"·인젝션 → 미분류.
- 테스트 데이터는 매번 사용자째 삭제 → DB엔 씨앗만 남음. `tsc`·`eslint` 통과. **브라우저 E2E는 아직**(Chromium 다운로드 멈춤).

### 변경 사항

| 영역 | 변경 내용 |
|---|---|
| 크롤러 (`feat/hot-news`) | Hot 판정 단계, 사건 키, `--detect-hot[=DAYS]`, 수집 범위에 사용자 영향 보안 사고·오작동·약관 변경 포함 |
| DB | `articles.hot_*` 3컬럼 / 비교 테이블 7개 + `model_order` + 실행 중복 방지 unique + `suggest_task_types` 함수, `pg_trgm`은 `extensions` 스키마 |
| 서버 모듈 | `src/modules/{account,catalog,task,execution,comparison,evaluation}` — 라우트는 얇게, 판단은 모듈에 |
| 어댑터 | `src/lib/openrouter.ts`(실험 대상), `src/lib/judge-llm.ts`(시스템 판단, 실행 기록에 안 남김) |
| API | `/api/catalog/models`, `/api/admin/catalog/sync`, `/api/tasks/{resolve,from-sample}`, `/api/task-types/suggest`, `/api/comparisons{,/suggest,/{id},/{id}/run,/{id}/choice}` |
| 화면 | 홈 `HomeSlider`(뉴스 ↔ 비교), `SlideTab`, `components/compare/*`, Sidebar 비교 화면에서 숨김 |
| 문서 | `docs/` 설계 4종 + UML, DO.md 재정리 |

### 아키텍처 노트
- **블라인드 구멍**: 처음 RLS는 사용자가 자기 `runs`·`comparisons`를 읽을 수 있었다 → 로그인 토큰으로 Supabase에 직접 `requested_model_id`를 조회하면 선택 전에 모델을 알 수 있었다. 두 테이블의 사용자 SELECT를 지우고 블라인드 규칙을 거치는 서버 API로만 읽게 했다. **"화면에서 가린다"가 아니라 "서버가 안 보낸다"여야 한다.**
- **글자 유사도는 의미를 모른다**: `similarity('자소서 다듬기','문장 교정') = 0`. 유형 후보를 글자 유사도로 추리면 정답이 빠진다 → 유형 100개 이하 동안은 전체를 판정 AI에 넘긴다. 자동완성(글자 맞추기)에만 `pg_trgm`.
- **의미 묶기 패턴이 두 번 나왔다**: 기사→사건(Hot), 샘플→작업 유형. "기존 묶음 목록을 보여주고 같으면 재사용, 없으면 새로" + temperature 0 + JSON 스키마 + 인젝션 방지 문구.
- **움직이는(transform) 부모 안에선 `position: fixed`가 화면 기준이 아니다**: 가로 슬라이드 안의 고정 버튼·전체 화면 창이 엉뚱한 곳에 붙었다 → 슬라이드 바깥에 두거나 `createPortal(document.body)`.
- **모델이 답에서 자기 이름을 말하면 블라인드가 깨질 수 있다**: 본문을 고치면 실험이 오염되므로 막지 않고 알려진 한계로 둔다.

---
