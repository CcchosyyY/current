# Current — 아키텍처

> 작성: 2026-10-15 · 상태: **설계안 v1** (구현 전)
> "무엇을"은 [`domain-stories.md`](./domain-stories.md)에 있다. 이 문서는 그것을 **어떻게 나눠서 만드는가**를 정한다.
> 그림(UML)은 [`architecture.puml`](./architecture.puml)에 있다. 문서 안의 `[UML-n]`이 그 파일의 다이어그램 번호다.
> 렌더링된 이미지: [`docs/uml/`](./uml/) — `UML-1_system-context.png` ~ `UML-7_comparison-states.png`
> 다시 그리기(.puml 수정 후): `docker run --rm -v "$PWD/docs:/data" -v /mnt/c/Windows/Fonts:/usr/share/fonts/win plantuml/plantuml:1.2024.7 -tpng -SdefaultFontName="Malgun Gothic" -o uml /data/architecture.puml`
> 용어는 도메인 스토리 §9 용어집을 그대로 쓴다.
> 1단계 구현 순서·API 계약·검증은 [`plan-stage1.md`](./plan-stage1.md).

---

## 1. 목표와 원칙

### 1-1. 이 아키텍처가 지켜야 하는 것 (품질 목표)

| 우선순위 | 목표 | 구체적으로 |
|---|---|---|
| 1 | **기록의 완전성** | 실행·선택이 하나도 빠지지 않고, 나중에 바뀌지 않는다. 순위·일관성·비용 분석이 전부 이 기록에서 나온다 |
| 2 | **블라인드의 공정성** | 선택 전에는 모델 이름이 브라우저에 **도달조차 하지 않는다** |
| 3 | **비용 통제** | 서버 키로 나가는 돈을 사용자·하루 단위로 제한한다. 비싼 호출은 개인 키로 |
| 4 | **변경에 강함** | 순위 계산 방식, 유형 묶기 기준, Hot 기준을 바꿔도 다른 모듈은 고칠 필요가 없다 |
| 5 | **단계별 시연 가능** | 1단계만 끝나도 동작하는 서비스. 뒤 단계가 앞 단계를 깨지 않는다 |

### 1-2. 설계 원칙

1. **OpenRouter를 부르는 곳은 단 한 곳**(모델 실행 모듈 + 그것이 쓰는 어댑터). 비용 측정, 키 선택, 기록 저장이 한 곳에 모인다.
2. **실험(실행)과 시스템 판단(판정 AI)을 섞지 않는다.** 판정 AI 호출은 실행 기록에 남지 않는다.
3. **원본 기록과 계산 결과를 분리한다.** 실행·선택은 원본(추가만), 순위·일관성·비용 요약은 계산 결과(언제든 다시 계산).
4. **모듈은 자기 데이터만 쓴다.** 다른 모듈의 테이블은 그 모듈의 공개 함수를 통해서만 바꾼다. 읽기 전용 집계(평가)는 예외로 원본 테이블을 직접 읽는다.
5. **API 라우트는 얇게.** 라우트는 입력 검증(zod)과 인증만 하고, 판단은 모듈 서비스에 맡긴다.
6. **기존 뉴스 코드는 지금 구조 그대로 둔다.** 새 모듈만 새 구조로 만들고, 뉴스 쪽 정리는 나중에 필요할 때 한다.

---

## 2. 시스템 컨텍스트 `[UML-1]`

Current와 바깥 세계의 관계.

```
                         ┌────────────────────┐
   👤 방문자 ───────────▶ │                    │ ◀──────── 🤖 크롤러 (GitHub Actions, 12h)
   👤 사용자 ───────────▶ │      Current       │              │
     (Google 로그인)      │  (Next.js 16 앱)   │              ├──▶ 📰 언론사 RSS 6곳
                         │                    │              └──▶ 🧠 Anthropic (Haiku: 분류·Hot)
                         └─────────┬──────────┘
                                   │
          ┌────────────────────────┼─────────────────────────┐
          ▼                        ▼                         ▼
   🗄️ Supabase               🔌 OpenRouter               🧠 Anthropic
   (Postgres + Auth)         (실험 대상 모델들)            (Haiku: 작업 유형 묶기)
```

| 외부 시스템 | 역할 | 누가 부르나 | 인증 |
|---|---|---|---|
| Supabase Postgres | 모든 데이터 | 앱(사용자 세션 + RLS), 크롤러(service role) | anon 키 + 세션 / service role 키 |
| Supabase Auth | Google 로그인 | 앱 | OAuth |
| OpenRouter | 실험 대상 모델 호출, 모델 목록 | **앱의 실행·카탈로그 모듈만** | 서버 키 / 개인 키 |
| Anthropic | 판정 AI (분류, Hot, 유형 묶기) | 크롤러, 앱의 작업 모듈 | 서버 키 |
| RSS 6곳 | 기사 원천 | 크롤러 | 없음 |
| GitHub Actions | 크롤러 스케줄 | — | Secrets |

> 크롤러 keepalive는 하지 않기로 했다. 레포에 60일 동안 커밋이 없으면 GitHub이 크롤러를 끄고, 그때부터 뉴스·Hot이 멈춘다. 비교 기능은 영향을 받지 않는다.

---

## 3. 모듈 (경계) `[UML-2]`

### 3-1. 모듈 지도

```
┌───────────────────────── 뉴스 영역 (기존) ─────────────────────────┐
│  [뉴스 수집]  기사 수집·분류          [Hot]  Hot 판정·사건 묶기·노출   │
└──────────────────────────────────────────┬──────────────────────────┘
                                           │ 사건(새 모델) 읽기
┌───────────────────────── 비교 영역 (신규) ─▼─────────────────────────┐
│                                   [새 모델 추천]                      │
│                                    │        │                        │
│  [계정]          [작업] ◀──────────┘        ▼                        │
│   로그인·키       이름→유형 묶기       [모델 카탈로그]                 │
│     │             자동완성·샘플          OpenRouter 모델 목록          │
│     │               │                      │                         │
│     │               ▼                      ▼                         │
│     └────────▶ [비교] ───────────▶ [모델 실행] ───▶ 🔌 OpenRouter      │
│                블라인드·순서·선택     호출·측정·기록                    │
│                     │                      │                         │
│                     └──────┬───────────────┘                         │
│                            ▼ (읽기만)                                 │
│                         [평가]  순위·일관성·비용 시뮬레이터              │
└──────────────────────────────────────────────────────────────────────┘
공통: [의미 묶기] 패턴 (Hot 사건 묶기, 작업 유형 묶기)  ·  [판정 AI 어댑터]  ·  [OpenRouter 어댑터]
```

### 3-2. 모듈별 책임

각 모듈을 "**하는 일 / 소유 데이터 / 남에게 주는 것 / 모르는 것**"으로 정의한다. "모르는 것"이 경계다.

#### ① 뉴스 수집 `news` *(기존)*
| | |
|---|---|
| 하는 일 | RSS 수집, 키워드+판정 AI 분류, 이미지 보완, 저장 |
| 소유 데이터 | `articles`(본문 쪽 컬럼), `categories`, `ai_models` |
| 주는 것 | `GET /api/articles`, `GET /api/articles/[id]`, 기존 화면 |
| 모르는 것 | Hot, 비교, 사용자 |
| 위치 | `scripts/crawl-articles.mjs`, `src/app/api/articles/*` |

#### ② Hot `hot` *(기존, 이번에 만든 것)*
| | |
|---|---|
| 하는 일 | Hot 판정(새 모델/긴급), 사건 키로 묶기, 노출 기간 적용 |
| 소유 데이터 | `articles.hot_type`, `hot_reason`, `hot_event` |
| 주는 것 | `GET /api/hot` → 사건 목록, **"새 모델 사건" 조회 함수**(새 모델 추천이 씀) |
| 모르는 것 | 비교, 카탈로그 |
| 위치 | 크롤러의 Hot 단계, `src/app/api/hot`, `src/components/HotSection.tsx` |

#### ③ 계정 `account`
| | |
|---|---|
| 하는 일 | 로그인 확인, 보호 경로, (3단계) 개인 키 연결·해제, 서버 키 사용 한도 확인 |
| 소유 데이터 | Supabase `auth.users`, (3단계) 개인 키 저장소 |
| 주는 것 | `requireUser()`, `getKeyFor(user, catalogModel)` → 어느 키로 실행할지 |
| 모르는 것 | 비교 내용, 샘플 |
| 위치 | `src/lib/auth.ts`(기존), `src/middleware.ts`(보호 경로 추가), `src/modules/account/` |

#### ④ 모델 카탈로그 `catalog`
| | |
|---|---|
| 하는 일 | OpenRouter 모델 목록 동기화(가격, 무료 여부, 컨텍스트 길이, 처음 본 시각), 브랜드(`ai_models`) 연결, **서버 키 허용 목록** 관리 |
| 소유 데이터 | `catalog_models` |
| 주는 것 | `listModels({ free?, brand? })`, `getModel(id)`, `newModelsSince(date, brand)` |
| 모르는 것 | 비교, 순위, 사용자 |
| 위치 | `src/modules/catalog/` |

#### ⑤ 작업 `task`
| | |
|---|---|
| 하는 일 | 작업 이름 → 작업 유형 묶기(**의미 묶기** 패턴), 자동완성, 샘플 저장, 내 작업 저장 |
| 소유 데이터 | `task_types`, `tasks`, `samples` |
| 주는 것 | `suggestTypes(query, user)`, `resolveTask(user, name)` → 작업+유형, `saveSample()`, `saveTask()` |
| 모르는 것 | 모델, OpenRouter, 순위 계산 방식 |
| 위치 | `src/modules/task/` |

#### ⑥ 비교 `comparison`
| | |
|---|---|
| 하는 일 | 비교 생성, 순서 섞기, 블라인드 적용(이름 가리기), 선택 받기, 공개 |
| 소유 데이터 | `comparisons`, `choices` |
| 주는 것 | `createComparison()`, `getComparisonView(id, user)`(블라인드면 이름 제거), `choose()` |
| 모르는 것 | OpenRouter 호출 방법, 비용 계산식, 순위 계산식 |
| 위치 | `src/modules/comparison/` |

#### ⑦ 모델 실행 `execution`
| | |
|---|---|
| 하는 일 | 모델 1개 × 샘플 1개 실행, 시간 측정, 토큰·비용 기록, 실제 응답 모델 버전 기록, 실패 기록 |
| 소유 데이터 | `runs` |
| 주는 것 | `execute({ comparisonId, catalogModelId, sample, position, keyKind })` → 실행 기록 |
| 모르는 것 | 블라인드, 선택, 순위, 작업 유형의 의미 |
| 위치 | `src/modules/execution/`, 어댑터 `src/lib/openrouter.ts` |

#### ⑧ 평가 `evaluation`
| | |
|---|---|
| 하는 일 | 유형별 전체 순위, 내 순위, 추천 모델 3개 고르기, (3단계) 일관성·비용 시뮬레이터 |
| 소유 데이터 | **없음** (원본을 읽어 계산만). 성능이 필요해지면 캐시용 materialized view |
| 주는 것 | `rankings(typeId, scope)`, `suggestModels(typeId, user)` |
| 모르는 것 | 비교 화면, OpenRouter |
| 위치 | `src/modules/evaluation/`, DB 함수 `ranking_*` |

#### ⑨ 새 모델 추천 `suggestion` *(4단계)*
| | |
|---|---|
| 하는 일 | 새 모델 사건 ↔ 카탈로그 모델 연결, 내 작업별 "비교해 보기" 만들기, 미리 채운 비교 시작 |
| 소유 데이터 | `event_model_links`(사건 ↔ 카탈로그 모델) |
| 주는 것 | `suggestionsFor(user)`, `prefillComparison(suggestionId)` |
| 모르는 것 | Hot 판정 방법, 실행 방법 |
| 위치 | `src/modules/suggestion/` |

### 3-3. 의존 규칙

화살표 방향으로만 부를 수 있다. 반대 방향은 금지.

```
app/api 라우트 ──▶ 모듈 서비스 ──▶ 모듈 저장소(repository) ──▶ Supabase
                      │
                      └──▶ 어댑터(openrouter, judge-llm)

비교 ──▶ 작업, 모델 실행, 계정, 평가(추천 모델)
모델 실행 ──▶ 카탈로그(가격·허용 목록), 계정(키)
새 모델 추천 ──▶ Hot(읽기), 카탈로그, 작업, 비교
평가 ──▶ (원본 테이블 읽기만)
작업 ──▶ 판정 AI 어댑터
```

**금지 예시**
- ❌ 모델 실행이 비교를 부른다 (실행은 블라인드를 몰라야 한다)
- ❌ 뉴스·Hot이 비교 영역 어느 것이든 부른다
- ❌ 화면(클라이언트)이 OpenRouter나 판정 AI를 직접 부른다
- ❌ 평가가 `runs`나 `choices`에 쓴다

---

## 4. 공통 패턴: 의미 묶기 (Semantic Grouping)

### 4-1. 문제

사용자나 외부 세계가 만드는 것(기사, 작업 이름)은 표현이 제각각인데, 서비스는 **같은 의미끼리 모아야** 쓸 수 있다(사건 카드, 유형별 순위).

### 4-2. 방법 (Hot에서 이미 검증)

```
입력: 새 항목들 + 이미 있는 묶음 목록(키, 이름, 설명)
  ↓
판정 AI: "같은 묶음이 있으면 그 키를 재사용, 없으면 새 키를 제안"
  ↓ temperature 0, JSON 스키마로 출력 고정
검증: 키 형식 정리(소문자-케밥), 없는 키를 재사용했다고 하면 새 묶음으로 처리
  ↓
저장: 항목 → 묶음 키.  새 묶음이면 묶음 목록에 추가
  ↓
다음 배치는 늘어난 묶음 목록을 받는다 (배치·실행 사이에서 키가 일관되게)
```

### 4-3. 두 곳의 차이

| | Hot 사건 묶기 | 작업 유형 묶기 |
|---|---|---|
| 항목 | 기사 (제목+요약) | 작업 이름 (+ 첫 샘플 앞부분, 선택) |
| 묶음 | 사건 (`hot_event`) | 작업 유형 (`task_types`) |
| 묶음 수명 | 7일 (그 이후 사건은 목록에서 빠짐) | 영구 (계속 늘어남) |
| 실행 위치 | 크롤러(Node 스크립트, 배치) | 앱 서버(요청 1건씩, 실시간) |
| 묶음 목록 크기 | 수십 개 | 수백 개까지 늘 수 있음 → **후보만 추려서** 넘긴다 (§4-4) |
| 실패 시 | Hot 없음 | "미분류"로 두고 나중에 다시 |
| 사람 개입 | 없음 | 관리자 병합 (`merged_into`) |

> 런타임이 달라서(크롤러 `.mjs` vs 앱 TypeScript) **코드는 공유하지 않고 방법(프롬프트 구조·검증 규칙)을 공유**한다.

### 4-4. 작업 유형이 많아졌을 때

유형이 수백 개가 되면 전부 프롬프트에 넣기 어렵다. 그래서 **후보 추리기 → 판정** 2단계로 한다.

1. **후보 추리기:** 유형이 **100개 이하인 동안은 추리지 않고 전체를 넘긴다.** 글자 유사도(`pg_trgm`)는 의미를 몰라서 "자소서 다듬기"와 "문장 교정"의 유사도가 0이다(S1 실측). 100개를 넘으면 임베딩 유사도로 상위 20개를 추린다.
2. **판정 (판정 AI):** 후보 20개 중 재사용 또는 새 유형.

자동완성(이야기 2의 ③)은 사용자가 치는 **글자**와 맞추는 것이라 `pg_trgm` 글자 유사도로 충분하다.

---

## 5. 데이터 설계 `[UML-3]`

### 5-1. 테이블 한눈에

```
기존:   articles(+hot_*) ─ categories ─ ai_models ─ bookmarks ─ newsletter_subscribers
신규:
  catalog_models ──(brand)──▶ ai_models
  task_types ◀── tasks ◀── samples
                   ▲          ▲
  comparisons ─────┴──────────┘
      │ 1:N
      ├──▶ runs ──▶ catalog_models
      └──▶ choices(1:1) ──▶ runs
  event_model_links: articles.hot_event ↔ catalog_models   (4단계)
```

### 5-2. `catalog_models` — OpenRouter 모델 목록 *(1단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | text PK | OpenRouter 모델 ID. 예: `google/gemini-2.5-flash`, `meta-llama/llama-3.3-70b-instruct:free` |
| `canonical_slug` | text | OpenRouter가 주는 고정 식별자(버전 포함). 별칭이 바뀌어도 추적용 |
| `name` | text | 표시 이름 |
| `provider` | text | 회사 (`google`, `openai`…) |
| `ai_model_slug` | text FK → `ai_models.slug`, null 허용 | 브랜드 연결 (Gemini 등). 4단계 추천과 로고 표시에 씀 |
| `prompt_price` | numeric | 입력 토큰당 USD |
| `completion_price` | numeric | 출력 토큰당 USD |
| `is_free` | bool | 가격이 0이거나 `:free` |
| `server_allowed` | bool | **서버 키로 실행 가능** (R-25). 관리자가 켠다. 처음엔 `openai/gpt-5-nano`, `google/gemini-2.5-flash-lite`, `anthropic/claude-haiku-5.5` |
| `default_rank` | smallint, null | 순위 데이터가 없을 때의 기본 추천 순서 (1~3) |
| `context_length` | int | |
| `modality` | text | 텍스트 모델만 비교 대상 (`text->text`) |
| `first_seen_at` | timestamptz | **처음 본 시각** — 새 모델 감지 |
| `last_seen_at` | timestamptz | 목록에서 사라졌는지 판단 |
| `is_active` | bool | 최근 동기화 목록에 있었나 |

- 동기화: 하루 1번 + 관리자 수동. OpenRouter `GET /api/v1/models`.
- RLS: 누구나 읽기, 쓰기는 service role만.

### 5-3. `task_types` — 작업 유형 *(1단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `key` | text unique | 케밥 키. 예: `text-proofreading` |
| `name` | text | 표시 이름(한국어). 예: "문장 교정" |
| `description` | text | 판정 AI가 묶을 때 참고하는 설명. 예: "글의 맞춤법·문법·표현을 다듬는 작업" |
| `is_unclassified` | bool | "미분류" 유형 하나만 true |
| `merged_into` | uuid FK → `task_types.id`, null | 병합되면 살아남는 유형을 가리킨다 |
| `created_by` | text | `seed`(출발점 6개) / `judge`(판정 AI가 만듦) / `admin` |
| `created_at` | timestamptz | |

- 유형별 "비교 횟수"(자동완성 표시용)는 저장하지 않고 `comparisons`에서 센다(R-15와 같은 원칙).
- 순위·자동완성은 `merged_into`를 따라가 **최종 유형**으로 합쳐 계산한다.
- RLS: 누구나 읽기, 쓰기는 서버만.

### 5-4. `tasks` — 사용자의 작업 *(1단계, 저장 기능은 4단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → `auth.users` | |
| `name` | text | 사용자가 쓴 작업 이름 ("자소서 다듬기") |
| `name_normalized` | text | 공백·대소문자 정리. **(user_id, name_normalized) unique** → R-6 재사용 |
| `task_type_id` | uuid FK → `task_types` | 묶인 유형 |
| `classified_by` | text | `judge` / `user_pick`(자동완성에서 고름) / `fallback`(미분류) |
| `is_saved` | bool | 내 작업으로 저장했나 (4단계) |
| `current_model_id` | text FK → `catalog_models`, null | 지금 쓰는 모델 (4단계) |
| `created_at` | timestamptz | |

- RLS: 본인만 읽기·쓰기.

### 5-5. `samples` — 입력 샘플 *(1단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `task_id` | uuid FK → `tasks` | |
| `user_id` | uuid FK | (RLS 편의상 중복 보관) |
| `content` | text | 입력 내용. 길이 제한(초안 8,000자) |
| `content_hash` | text | sha256. 같은 샘플 재사용·(3단계) 캐시 키 |
| `is_saved` | bool | 내 작업의 대표 샘플 (4단계) |
| `created_at` | timestamptz | |

- RLS: **본인만** (R-20). 다른 사용자는 전체 순위에서 선택 결과만 쓰고 샘플 내용은 못 본다.

### 5-6. `comparisons` — 비교 한 회 *(1단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `task_id` | uuid FK → `tasks` | |
| `task_type_id` | uuid FK → `task_types` | **생성 시점 스냅샷** (R-13) |
| `sample_id` | uuid FK → `samples` | |
| `is_blind` | bool | |
| `status` | text | `running` → `awaiting_choice` → `chosen` / `failed` / `abandoned` |
| `model_count` | int | 기본 3 |
| `source` | text | `manual` / `new_model`(4단계) / `rerun`(같은 샘플 다시) |
| `source_event` | text, null | 새 모델 추천이면 사건 키 (`hot_event`) |
| `settings` | jsonb | 사용자가 고른 설정 `{reasoning: default\|low\|high, maxLength: default\|short}` — 비교 안의 모든 실행에 같게 적용 (R-27) |
| `created_at` | timestamptz | |
| `completed_at` | timestamptz, null | 실행이 다 끝난 시각 |

상태 전이 `[UML-7]`

```
running ──(성공 2개 이상)──▶ awaiting_choice ──(선택)──▶ chosen
   │                              │
   └──(성공 1개 이하)──▶ failed    └──(24시간 무응답)──▶ abandoned
```

- `model_order` text[] *(S6에서 추가)*: 만들 때 섞은 모델 순서 (index = 표시 위치).
- RLS: **사용자 직접 조회 불가** (S6에서 변경). 본인 행 SELECT를 열어 두면 사용자가 자기 토큰으로 Supabase에 직접 `model_order`를 읽어 블라인드를 깰 수 있다(R-8). 모든 읽기는 블라인드 규칙을 적용하는 서버 API(`comparison/blind.ts`)로만.

### 5-7. `runs` — 실행 기록 *(1단계, 가장 중요)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `comparison_id` | uuid FK, null | 비교에 속한 실행 (3단계 반복 측정도 비교 아래로 둘지는 3단계에서) |
| `repeat_group_id` | uuid, null | 반복 묶음 (3단계) |
| `user_id` | uuid FK | |
| `task_type_id` | uuid FK | 집계 편의상 중복 보관 (비교의 스냅샷과 같은 값) |
| `sample_id` | uuid FK | |
| `requested_model_id` | text FK → `catalog_models` | 요청한 모델 |
| `response_model` | text | **OpenRouter가 실제로 응답한 모델** (R-12) |
| `model_canonical_slug` | text, null | 실행 시점 `catalog_models.canonical_slug` — 응답 `model`엔 버전이 안 붙어서 이걸로 버전 추적 (2026-10-15 실측) |
| `provider_name` | text, null | OpenRouter가 실제로 연결한 공급사 (같은 모델도 공급사마다 다를 수 있음. 예: Claude Haiku 5.5 → Azure) |
| `system_fingerprint` | text, null | 공급사 쪽 빌드 식별자 (있을 때만) |
| `display_position` | smallint | 0=A, 1=B, 2=C (R-9) |
| `key_kind` | text | `server` / `user` |
| `params` | jsonb | OpenRouter에 실제로 보낸 파라미터 (reasoning, max_tokens 등. 기본값이면 안전 상한만) |
| `status` | text | `success` / `error` / `timeout` |
| `output_text` | text, null | 결과 |
| `error_code` | text, null | |
| `input_tokens` | int, null | |
| `output_tokens` | int, null | |
| `cost_usd` | numeric(12,8), null | OpenRouter가 알려준 비용 우선, 없으면 카탈로그 단가 × 토큰 |
| `cost_source` | text | `openrouter` / `estimated` |
| `latency_ms` | int, null | 요청 → 응답 완료 |
| `ttft_ms` | int, null | 첫 글자까지 (스트리밍 도입 시) |
| `openrouter_generation_id` | text, null | OpenRouter 쪽 조회용 |
| `started_at` | timestamptz | |
| `finished_at` | timestamptz, null | |

- **추가만**(R-11): UPDATE는 "진행 중 → 완료"로 결과를 채우는 1회만 허용, DELETE 없음.
  구현: 사용자에게는 SELECT도 주지 않는다(`requested_model_id`로 블라인드가 깨지므로, S6에서 변경). 읽기·쓰기 모두 서버(service role)만.
  "running → 끝" UPDATE는 `status='running'` 조건으로 한 번만 되게 한다.
- `(comparison_id, display_position)` unique *(S6에서 추가)*: 같은 비교를 두 번 실행하면 두 번째가 여기서 막힌다 → 비용 두 번 방지.
- 인덱스: `(task_type_id, requested_model_id)`, `(comparison_id)`, `(user_id, started_at desc)`.

### 5-8. `choices` — 선택 *(1단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `comparison_id` | uuid FK **unique** | 비교당 1번 (R-10) |
| `user_id` | uuid FK | |
| `kind` | text | `pick`(이게 낫다) / `tie`(셋 다 비슷함 → 무승부) / `all_bad`(전부 별로 → 순위 제외, 기록만) |
| `chosen_run_id` | uuid FK → `runs`, null | `pick`일 때만 |
| `was_blind` | bool | 순위 가중치용 (R-18) |
| `decision_ms` | int, null | 결과가 다 뜬 뒤 고르기까지 걸린 시간 (참고 지표) |
| `created_at` | timestamptz | |

- RLS: 본인만. 전체 순위는 아래 DB 함수가 집계한다.

### 5-9. 순위 계산 — DB 함수 *(2단계)*

전체 순위는 다른 사용자의 선택까지 모아야 하는데, RLS 때문에 사용자 세션으로는 남의 행을 못 읽는다. 그래서 **집계 결과만 돌려주는 DB 함수**(SECURITY DEFINER)를 둔다. 샘플 내용·사용자 ID는 절대 반환하지 않는다.

```sql
-- 2단계에서 확정. 모양만 미리.
ranking_global(task_type_id uuid)  → (model_id, wins, losses, ties, comparisons, score, avg_cost, avg_latency)
ranking_mine(task_type_id uuid)    → 같은 모양, auth.uid()의 선택만
```

- 승패는 "선택된 실행 vs 같은 비교의 나머지 실행" **쌍 비교**로 펼친다. 3개 중 1개를 고르면 2승이 생긴다.
- 점수 방식(단순 승률 / Bradley-Terry / Elo)과 블라인드 가중치는 2단계에서 정한다.
- 병합된 유형은 `merged_into`를 따라 합친다.

### 5-10. `event_model_links` — 사건 ↔ 카탈로그 모델 *(4단계)*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `hot_event` | text | 사건 키 |
| `catalog_model_id` | text FK | |
| `match_reason` | text | `brand_and_first_seen` / `name_match` / `admin` |
| `confidence` | real | |
| `created_at` | timestamptz | |
| PK | (`hot_event`, `catalog_model_id`) | |

### 5-11. 기존 테이블과의 관계

| 기존 | 새 설계에서 |
|---|---|
| `articles` + `hot_*` | 그대로. 새 모델 추천이 `hot_event`를 읽는다 |
| `ai_models` (37개 브랜드) | 그대로. `catalog_models.ai_model_slug`가 가리킨다 → 비교 화면에서 기존 로고·브랜드색 재사용 |
| `categories` | 비교와 무관 |
| `bookmarks` | 그대로 |
| `auth.users` | 그대로. 모든 신규 사용자 테이블이 참조 |

---

## 6. 주요 흐름

### 6-1. 블라인드 비교 `[UML-4]`

```
브라우저                      Current 서버                                      외부
───────                      ───────────                                      ────
① POST /api/tasks/resolve ─▶ 작업.resolveTask(user, "자소서 다듬기")
                              ├ 같은 이름 있으면 재사용 (R-6)
                              └ 없으면 후보 추리기 → 판정 AI ───────────────▶ 🧠 Haiku
                            ◀─ { task, taskType:"문장 교정", isNewType }

② GET /api/comparisons/suggest?taskType= ─▶ 평가.suggestModels() ─▶ 추천 3개

③ POST /api/comparisons ───▶ 비교.createComparison
   { taskId, sample,          ├ 계정: 로그인·서버 키 한도 확인
     modelIds[3], blind }     ├ 작업: saveSample
                              ├ 순서 섞기 → 위치 0,1,2 배정
                              └ comparisons(status=running) 저장
                            ◀─ { comparisonId, slots:[{runId, position}] }   ← 블라인드면 모델 ID 없음

④ POST /api/comparisons/{id}/run  (서버가 3개를 병렬 실행)
                              실행.execute ×3 ──────────────────────────────▶ 🔌 OpenRouter
                              ├ runs 저장 (토큰·비용·시간·response_model)
                              └ 2개 이상 성공 → awaiting_choice, 아니면 failed
                            ◀─ { slots:[{position, output, status, latency}] } ← 블라인드면 이름·비용 없음 (속도는 보냄)

⑤ POST /api/comparisons/{id}/choice ─▶ 비교.choose
   { kind:"pick", runId }      ├ 이미 선택했으면 거절 (R-10)
                              └ choices 저장, status=chosen
                            ◀─ { reveal:[{position, model, cost}] }          ← 이제 공개
```

**1단계 단순화:** ④는 스트리밍 없이 3개를 병렬로 돌리고 다 끝나면 한 번에 응답한다. 결과가 하나씩 뜨는 스트리밍(SSE)은 1단계 시연 뒤에 붙인다. 타임아웃은 모델당 60초로 한다.

### 6-2. 작업 유형 묶기 `[UML-5]`

```
resolveTask(user, name)
 ├ 1. name_normalized로 내 작업 찾기 → 있으면 끝 (판정 AI 안 부름)
 ├ 2. 후보 추리기: pg_trgm 유사도로 task_types + 별칭(묶인 작업 이름들) 상위 20개
 ├ 3. 판정 AI: { name, firstSamplePreview?, candidates[] } →
 │        { decision: "reuse", key } | { decision: "new", key, name, description }
 ├ 4. 검증: reuse인데 후보에 없는 key → new로 처리 / key 형식 정리
 ├ 5. new면 task_types insert (key 충돌 시 기존 것 재사용)
 └ 6. tasks insert → 반환
실패(시간 초과·오류) → "미분류" 유형으로 저장, classified_by='fallback'
                    → 관리자/배치가 나중에 다시 resolve
```

### 6-3. 새 모델 추천 *(4단계)* `[UML-6]`

```
[매일] 카탈로그 동기화 → first_seen_at이 새 모델 발견
[크롤] Hot 사건(model_release) 생성
[연결 배치] 최근 사건 × 최근 카탈로그 새 모델
           (같은 브랜드 + first_seen_at이 사건 ±7일 + 이름 토큰 일치) → event_model_links
[사용자가 '내 작업' 열 때] 내 작업 × 연결된 새 모델 → "비교해 보기" 카드
[사용자가 누를 때] 비교 화면 미리 채우기: 저장 샘플 + {새 모델, 지금 쓰는 모델, 순위 1위} + 블라인드 ON
[사용자가 실행 누를 때] 6-1의 ③부터 동일, source='new_model', source_event=사건 키
```

---

## 7. API 설계

모든 비교 영역 API는 **로그인 필수**(없으면 401). 입력은 zod로 검증한다. 모델 이름이 들어가는 응답은 블라인드 규칙(R-8)을 서버에서 적용한다.

### 7-1. 1단계

| 메서드 | 경로 | 하는 일 | 모듈 |
|---|---|---|---|
| GET | `/api/catalog/models?free=true` | 비교에 쓸 수 있는 모델 목록 | 카탈로그 |
| ~~GET~~ | ~~`/api/task-types/suggest?q=`~~ | 자동완성 — 작업 이름 칸 제거로 **라우트 삭제**(10/15). 모듈 `suggestTasks()`는 남김 | 작업 |
| ~~POST~~ | ~~`/api/tasks/resolve`~~ | 작업 이름 → 작업+유형 — **라우트 삭제**(10/15). 모듈 `resolveTask()`는 남김(내 작업 저장에서 재사용) | 작업 |
| POST | `/api/tasks/from-sample` | **샘플 → 작업 이름+유형** (비교 화면 기본 경로, 판정 1회) | 작업 |
| GET | `/api/comparisons/suggest?taskTypeId=` | 기본 모델 3개 | 평가 |
| POST | `/api/comparisons` | 비교 만들기 (샘플 저장, 순서 섞기) | 비교 |
| POST | `/api/comparisons/{id}/run` | 실행 (병렬, 결과 반환) | 비교 → 실행 |
| POST | `/api/comparisons/{id}/choice` | 선택 → 공개 | 비교 |
| GET | `/api/comparisons/{id}` | 비교 다시 보기 (선택 전이면 블라인드 유지) | 비교 |
| GET | `/api/comparisons?mine=1` | 내 비교 기록 | 비교 |
| POST | `/api/admin/catalog/sync` | 카탈로그 동기화 (관리자·스케줄) | 카탈로그 |

### 7-2. 2단계 이후

| 메서드 | 경로 | 단계 |
|---|---|---|
| GET | `/api/rankings?taskTypeId=&scope=global\|mine` | 2 |
| POST | `/api/runs/repeat` | 3 (반복 측정) |
| POST | `/api/simulator` | 3 (비용 시뮬레이터) |
| POST/DELETE | `/api/account/key` | 3 (개인 키, 보관 방식 결정 후) |
| PATCH | `/api/tasks/{id}` (저장·지금 쓰는 모델) | 4 |
| GET | `/api/suggestions` | 4 |
| POST | `/api/admin/task-types/merge` | 필요할 때 |

---

## 8. 화면 구성 (1단계)

경로 `/compare` (로그인 필수, `PROTECTED_ROUTES`에 추가). 사이드바·헤더에 "Compare" 메뉴 추가.

```
┌─ 1. 무엇을 하나요? ─────────────────────────────────────────┐
│ 작업 이름 [자소서 다듬|                       ]               │
│           ┌──────────────────────────────┐                  │
│           │ 문장 교정 · 128회 비교됨       │ ← 자동완성       │
│           │ 자소서 다듬기 (내 작업)        │                  │
│           └──────────────────────────────┘                  │
│ 샘플      [ 자기소개서 문단 붙여넣기 ...                 ]     │
├─ 2. 어떤 모델로? ───────────────────────────────────────────┤
│ [GPT-5 nano ✕] [Gemini 2.5 Flash Lite ✕] [Claude Haiku 5.5 ✕] │
│ "문장 교정에서 많이 선택된 모델이에요"   오늘 남은 비교 4/5회   │
│ [■] 모델 이름 가리기                         [ 비교 실행 ▶ ]  │
├─ 3. 결과 ───────────────────────────────────────────────────┤
│ ┌─ A ─────────┐ ┌─ B ─────────┐ ┌─ C ─────────┐              │
│ │ 결과 텍스트  │ │ 결과 텍스트  │ │ 실패: 시간초과│              │
│ │ 3.2초        │ │ 5.1초        │ │             │              │
│ │ [이게 낫다]  │ │ [이게 낫다]  │ │             │              │
│ └─────────────┘ └─────────────┘ └─────────────┘              │
│            [셋 다 비슷함]  [전부 별로]                          │
├─ 4. 공개 (선택 후) ──────────────────────────────────────────┤
│ A = Gemini 2.5 Flash Lite · $0.0005   B = Claude Haiku 5.5 ✔ · $0.0006 │
│ [같은 샘플로 다시]  [다른 모델로]                               │
└─────────────────────────────────────────────────────────────┘
```

| 화면 요소 | 재사용할 기존 것 |
|---|---|
| 모델 로고·브랜드색 | `ai_models` + `ArticleLogo`/`ModelCard` 스타일 (카탈로그 → 브랜드 연결) |
| 로그인 버튼·상태 | `AuthProvider`, `UserMenu`, `useAuth` |
| 토스트 | `useToast` |
| 다크 테마 토큰 | `globals.css` |

**나중 화면:** `/compare/history`(내 비교 기록, 1단계 끝), `/rankings`(2), `/my-tasks`(4).

---

## 9. 폴더 구조

새 기능은 **모듈 폴더**로 만든다. 기존 `src/lib`, `src/components`는 그대로 둔다.

```
src/
├─ app/
│  ├─ (dashboard)/compare/page.tsx         ← 화면
│  └─ api/
│     ├─ catalog/models/route.ts           ← 얇은 라우트: 검증 + 인증 + 모듈 호출
│     ├─ tasks/from-sample/route.ts
│     └─ comparisons/...
├─ modules/                                 ← 새 비교 영역
│  ├─ account/      service.ts
│  ├─ catalog/      types.ts  service.ts  repository.ts  sync.ts
│  ├─ task/         types.ts  service.ts  repository.ts  grouping.ts(의미 묶기)
│  ├─ comparison/   types.ts  service.ts  repository.ts  blind.ts(공개 규칙)
│  ├─ execution/    types.ts  service.ts  repository.ts  cost.ts
│  ├─ evaluation/   service.ts  (DB 함수 호출)
│  └─ suggestion/   (4단계)
├─ lib/
│  ├─ openrouter.ts                         ← OpenRouter 어댑터 (HTTP·재시도·타임아웃)
│  ├─ judge-llm.ts                          ← 판정 AI 어댑터 (Haiku, JSON 스키마)
│  └─ supabase/  (기존)
└─ components/compare/                      ← 비교 화면 컴포넌트
```

- `modules/*/service.ts`는 **서버 전용**(`import "server-only"`). 클라이언트 컴포넌트가 실수로 가져오면 빌드가 실패한다.
- 모듈 안의 `types.ts`만 클라이언트가 가져올 수 있다.
- DB 마이그레이션은 `supabase/migrations/`에 파일로 남긴다(지금은 `schema.sql` 하나뿐이라 신규 테이블부터 파일로).

---

## 10. 비용·한도·보안

### 10-1. 비용

| 항목 | 기준 | 비고 |
|---|---|---|
| 비교 실행 (허용 목록 3개, 서버 키) | 1회 약 **$0.0016** (입력·출력 각 1,000토큰 가정) | **운영자 부담.** 서버 키에 OpenRouter 크레딧 충전 필요. 상한: 사용자 10명 × 5회 × 30일 ≈ $2.4/월, 100명 ≈ $24/월 |
| 기본 모델 단가 (2026-10-15 조회) | `gpt-5-nano` $0.05/$0.40 · `gemini-2.5-flash-lite` $0.10/$0.40 · `claude-haiku-5.5` $0.10/$0.50 (100만 토큰당 입력/출력) | 카탈로그 동기화로 갱신 |
| 유형 묶기 (Haiku) | 요청당 약 $0.0005 | 같은 이름 재사용(R-6)으로 대부분 0 |
| Hot 판정 (Haiku) | 크롤당 약 $0.01 | 기존 |
| 유료 모델 | 사용자 부담 | 개인 키 |

### 10-2. 한도 (서버 키 보호)

- 사용자당 하루 무료 비교 **5회**. 계산: 오늘 `comparisons` 수 (KST 자정 기준).
- 비교당 모델 최대 **3개**, 샘플 최대 **8,000자**, 추론 "높음" 불가 — 이를 넘으면 개인 키 (R-26).
- 서버 키 실행에는 안전 상한 `max_tokens: 4096`을 항상 붙인다 (사용자 설정이 기본값이어도).
- 반복 측정(3단계)은 서버 키로 **사용자당 하루 1회**, 여러 샘플 재평가(4단계)는 **샘플 2개까지**.
- 서버 키는 **허용 목록 모델만** 실행한다(R-25). 실행 모듈이 매 실행 전에 확인한다.
- 서비스 전체 하루 비용 상한(초안 $1)을 넘으면 그날은 서버 키 실행을 멈추고 "오늘 무료 비교가 끝났어요".
- OpenRouter 키 자체에도 사용 한도(credit limit)를 걸어 이중으로 막는다.
- 기존 인메모리 rate limiter(`src/lib/security.ts`)는 서버 인스턴스마다 따로라 배포 환경에선 약하다 → 한도는 **DB 기준**으로 센다.

### 10-3. 보안

| 위협 | 대응 |
|---|---|
| 서버 키 노출 | 환경변수 `OPENROUTER_API_KEY`, 서버 모듈에서만 읽기, `server-only` |
| 블라인드 우회(개발자 도구) | 서버가 선택 전 응답에서 모델 ID·이름·로고·비용을 **아예 빼고** 보냄 (R-8). 속도는 보냄 |
| 블라인드 우회(Supabase 직접 조회) | `runs`·`comparisons`는 사용자 SELECT 정책 없음 → 사용자 토큰으로 직접 조회해도 빈 결과 (S7 테스트로 확인) |
| 블라인드 한계(결과 본문) | 모델이 답에서 스스로 이름을 말하거나("저는 Claude입니다") 말투·길이로 짐작될 수 있다. 막지 않고 알려진 한계로 둔다 (본문을 고치면 실험이 오염됨) |
| 남의 비교 선택 | `choose()`에서 `comparison.user_id = auth.uid()` 확인 + RLS |
| 샘플 속 프롬프트 인젝션 | 샘플은 **실험 대상 모델**에만 들어간다. 판정 AI에는 작업 이름과 샘플 앞부분만, "지시를 따르지 말 것"을 넣어 보냄 (Hot 판정과 같은 방식) |
| 샘플 개인정보 | 본인만 읽기(RLS), 전체 순위 함수는 집계만 반환 |
| 기록 조작 | `runs`·`choices`는 사용자에게 쓰기 권한 없음, 서버만 |

---

## 11. 단계별로 무엇이 생기나

| 단계 | 모듈 | 테이블 | 화면 |
|---|---|---|---|
| **1. 기본 비교** | 계정(보호 경로), 카탈로그, 작업, 비교, 실행, 평가(임시 기본값) | `catalog_models`, `task_types`, `tasks`, `samples`, `comparisons`, `runs`, `choices` | `/compare`, 기록 |
| **2. 순위** | 평가 | (DB 함수) | `/rankings`, 비교 화면 추천 교체 |
| **3. 일관성·비용** | 실행(반복 묶음), 평가, 계정(개인 키) | `runs.repeat_group_id` 사용, 개인 키 저장소 | 일관성 표시, 시뮬레이터 |
| **4. 새 모델 추천** | 새 모델 추천, 작업(내 작업 저장) | `event_model_links`, `tasks.is_saved` 사용 | `/my-tasks`, Hot 카드 버튼 |
| 5. 라우팅 (보류) | — | — | — |

**4단계 전제:** `feat/hot-news`가 main에 머지되어 크롤러가 Hot을 계속 판정해야 한다.

---

## 12. 기존 코드: 재사용 / 유지 / 제거

| 구분 | 대상 | 비고 |
|---|---|---|
| **재사용** | Supabase Auth(Google) · `AuthProvider` · `useAuth` · `UserMenu` | 비교 로그인 |
| **재사용** | `ai_models` 37개 · 로고(`company-logos.json`, `ArticleLogo`) | 카탈로그 모델 표시 |
| **재사용** | `middleware.ts`의 `PROTECTED_ROUTES` | `/compare` 추가 |
| **재사용** | zod 검증, API 라우트 패턴, `useToast` | |
| **재사용** | 판정 AI 사용 패턴(JSON 스키마, temperature 0, 인젝션 방지 문구) | 작업 유형 묶기 |
| **유지** | 뉴스 수집·Hot·Trending·Models·Newsletter·Saved | 그대로 |
| **제거 대상 없음** | 주가·ESP32는 **애초에 코드가 없음** (계획만 있었음) | DO.md에서만 삭제 완료 |
| **정리 예정** | `docs/openrouter-integration.md`(10/13) | "개인 키만·로그인 없음" 전제 → 이 문서로 대체. 참고용으로만 |

---

## 13. 열린 질문

| ID | 질문 | 추천 | 언제까지 |
|---|---|---|---|
| ~~Q-1~~ | "비슷함 / 전부 별로" 선택지 | ✅ **둘 다 둔다** | 결정 |
| ~~Q-2~~ | 블라인드에서 속도 | ✅ **보여준다** | 결정 |
| ~~Q-3~~ | 유형 묶기 판정 AI | ✅ **Haiku** | 결정 |
| ~~Q-4~~ | 1단계 기본 모델 3개 | ✅ **GPT·Gemini·Claude 저가 모델, 서버 키(운영자 부담)** | 결정 |
| ~~Q-5~~ | 사용자당 하루 무료 비교 수 | ✅ **5회** | 결정 |
| Q-6 | 순위 점수 방식·블라인드 가중치 | Bradley-Terry, 블라인드만 집계로 시작 | 2단계 |
| Q-7 | 내 순위 표시 기준 수 | 10번 | 2단계 |
| ~~Q-8~~ | "복잡한 작업" 경계 | ✅ **R-26** (서버 키 = 기본 비교 하루 5회 + 반복 측정 하루 1회 + 샘플 2개까지) | 결정 |
| Q-9 | 개인 키 보관 (쿠키 vs DB 암호화) | ⏸️ 보류 | 3단계 전 |
| Q-10 | 유형 병합은 누가 | 관리자 수동 (SQL/간단한 관리 API) | 필요할 때 |
