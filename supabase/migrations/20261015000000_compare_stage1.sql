-- 비교 1단계 (docs/plan-stage1.md S1)
-- 테이블: catalog_models, task_types, tasks, samples, comparisons, runs, choices
-- 원칙: 사용자는 자기 행을 읽기만 한다. 모든 쓰기는 서버(service role, RLS 우회)만 한다.
--       runs는 추가만 한다 (R-11) — 사용자에게 쓰기 정책이 없으므로 서버 코드가 지킨다.

-- public이 아닌 extensions 스키마에 둔다 (Supabase 보안 권고 0014)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ============================================================
-- 1. CATALOG_MODELS — OpenRouter에서 부를 수 있는 모델
-- ============================================================
CREATE TABLE IF NOT EXISTS catalog_models (
  id TEXT PRIMARY KEY,                                  -- OpenRouter 모델 ID (예: openai/gpt-5-nano)
  canonical_slug TEXT,                                  -- 버전 포함 고정 식별자
  name TEXT NOT NULL,
  provider TEXT NOT NULL,                               -- ID 앞부분 (openai, google, anthropic …)
  ai_model_slug TEXT REFERENCES ai_models(slug) ON DELETE SET NULL,  -- 브랜드 연결
  prompt_price NUMERIC NOT NULL DEFAULT 0,              -- 입력 토큰당 USD
  completion_price NUMERIC NOT NULL DEFAULT 0,          -- 출력 토큰당 USD
  is_free BOOLEAN NOT NULL DEFAULT false,
  context_length INT,
  modality TEXT,
  server_allowed BOOLEAN NOT NULL DEFAULT false,        -- 서버 키로 실행 가능 (R-25). 동기화가 건드리지 않음
  default_rank SMALLINT,                                -- 순위 데이터 없을 때 기본 추천 순서. 동기화가 건드리지 않음
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),     -- 새 모델 감지
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_catalog_server_allowed ON catalog_models(default_rank) WHERE server_allowed;
CREATE INDEX IF NOT EXISTS idx_catalog_brand ON catalog_models(ai_model_slug);

-- ============================================================
-- 2. TASK_TYPES — 작업 유형 (늘어남, R-5)
-- ============================================================
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,                             -- 케밥 키 (text-proofreading)
  name TEXT NOT NULL,                                   -- 표시 이름 (문장 교정)
  description TEXT,                                     -- 판정 AI가 묶을 때 참고
  is_unclassified BOOLEAN NOT NULL DEFAULT false,
  merged_into UUID REFERENCES task_types(id),           -- 병합되면 살아남는 유형
  created_by TEXT NOT NULL DEFAULT 'judge' CHECK (created_by IN ('seed','judge','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_task_types_unclassified ON task_types(is_unclassified) WHERE is_unclassified;
CREATE INDEX IF NOT EXISTS idx_task_types_name_trgm ON task_types USING GIN (name extensions.gin_trgm_ops);

-- ============================================================
-- 3. TASKS — 사용자의 작업 (작업 이름 → 작업 유형)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  name_normalized TEXT NOT NULL,
  task_type_id UUID NOT NULL REFERENCES task_types(id),
  classified_by TEXT NOT NULL CHECK (classified_by IN ('judge','user_pick','fallback')),
  is_saved BOOLEAN NOT NULL DEFAULT false,              -- 내 작업 (4단계)
  current_model_id TEXT REFERENCES catalog_models(id),  -- 지금 쓰는 모델 (4단계)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name_normalized)                     -- R-6 재사용
);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_tasks_name_trgm ON tasks USING GIN (name extensions.gin_trgm_ops);

-- ============================================================
-- 4. SAMPLES — 입력 샘플 (본인만, R-20)
-- ============================================================
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
  content_hash TEXT NOT NULL,
  is_saved BOOLEAN NOT NULL DEFAULT false,              -- 내 작업 대표 샘플 (4단계)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_samples_task ON samples(task_id);

-- ============================================================
-- 5. COMPARISONS — 비교 한 회
-- ============================================================
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id),
  task_type_id UUID NOT NULL REFERENCES task_types(id),  -- 생성 시점 스냅샷 (R-13)
  sample_id UUID NOT NULL REFERENCES samples(id),
  is_blind BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','awaiting_choice','chosen','failed','abandoned')),
  model_count SMALLINT NOT NULL CHECK (model_count BETWEEN 2 AND 10),
  settings JSONB NOT NULL DEFAULT '{"reasoning":"default","maxLength":"default"}',  -- R-27
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','new_model','rerun')),
  source_event TEXT,                                    -- 새 모델 추천의 사건 키 (4단계)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comparisons_user ON comparisons(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comparisons_type ON comparisons(task_type_id);

-- ============================================================
-- 6. RUNS — 실행 기록 (모든 분석의 원천, 추가만 R-11)
-- ============================================================
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID REFERENCES comparisons(id),
  repeat_group_id UUID,                                 -- 반복 묶음 (3단계)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id),
  sample_id UUID NOT NULL REFERENCES samples(id),
  requested_model_id TEXT NOT NULL REFERENCES catalog_models(id),
  response_model TEXT,                                  -- 응답의 model
  model_canonical_slug TEXT,                            -- 실행 시점 버전 (R-12)
  provider_name TEXT,                                   -- 실제 공급사
  system_fingerprint TEXT,
  display_position SMALLINT NOT NULL CHECK (display_position >= 0),  -- 0=A (R-9)
  key_kind TEXT NOT NULL CHECK (key_kind IN ('server','user')),
  params JSONB NOT NULL DEFAULT '{}',                   -- 실제로 보낸 파라미터
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','success','error','timeout')),
  output_text TEXT,
  error_code TEXT,
  input_tokens INT,
  output_tokens INT,
  reasoning_tokens INT,
  cost_usd NUMERIC(12,8),
  cost_source TEXT CHECK (cost_source IN ('openrouter','estimated')),
  latency_ms INT,
  ttft_ms INT,
  openrouter_generation_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_runs_comparison ON runs(comparison_id);
CREATE INDEX IF NOT EXISTS idx_runs_type_model ON runs(task_type_id, requested_model_id);
CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at) WHERE key_kind = 'server';  -- 하루 서비스 예산 계산

-- ============================================================
-- 7. CHOICES — 선택 (비교당 1번, R-10)
-- ============================================================
CREATE TABLE IF NOT EXISTS choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID NOT NULL UNIQUE REFERENCES comparisons(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pick','tie','all_bad')),
  chosen_run_id UUID REFERENCES runs(id),
  was_blind BOOLEAN NOT NULL,
  decision_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'pick') = (chosen_run_id IS NOT NULL))
);

-- ============================================================
-- 8. ROW LEVEL SECURITY — 읽기만 열고, 쓰기는 서버만
-- ============================================================
ALTER TABLE catalog_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_models_select_public" ON catalog_models FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "task_types_select_public"     ON task_types     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tasks_select_own"       ON tasks       FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "samples_select_own"     ON samples     FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comparisons_select_own" ON comparisons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "runs_select_own"        ON runs        FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "choices_select_own"     ON choices     FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 9. SEED — 작업 유형 출발점 (늘어나는 목록의 시작, 고정 목록 아님)
-- ============================================================
INSERT INTO task_types (key, name, description, is_unclassified, created_by) VALUES
  ('unclassified',     '미분류',   '판정 AI가 실패했을 때 임시로 두는 곳. 나중에 다시 묶는다.', true, 'seed'),
  ('text-proofreading','문장 교정', '글의 맞춤법·문법·띄어쓰기·표현을 자연스럽게 다듬는 작업 (자기소개서, 이메일, 보고서 다듬기 포함)', false, 'seed'),
  ('translation',      '번역',     '한 언어의 글을 다른 언어로 옮기는 작업', false, 'seed'),
  ('summarization',    '요약',     '긴 글·회의록·기사·문서를 짧게 줄여 핵심을 뽑는 작업', false, 'seed'),
  ('code-review',      '코드 리뷰', '코드의 버그·개선점·가독성을 검토하고 설명하는 작업', false, 'seed'),
  ('classification',   '분류',     '글이나 항목을 정해진 범주·라벨·감정 등으로 나누는 작업', false, 'seed'),
  ('writing',          '글쓰기',   '주제나 조건을 받아 새 글(블로그, 소개글, 광고 문구 등)을 쓰는 작업', false, 'seed')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 10. SEED — 서버 키 허용 목록 (R-25). 나머지 필드는 카탈로그 동기화가 채운다.
--     가격: 2026-10-15 OpenRouter 조회 (토큰당 USD)
-- ============================================================
INSERT INTO catalog_models (id, name, provider, ai_model_slug, prompt_price, completion_price, server_allowed, default_rank) VALUES
  ('openai/gpt-5-nano',            'GPT-5 Nano',            'openai',    'chatgpt', 0.00000005, 0.0000004, true, 1),
  ('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'google',    'gemini',  0.0000001,  0.0000004, true, 2),
  ('anthropic/claude-haiku-5.5',   'Claude Haiku 5.5',      'anthropic', 'claude',  0.0000001,  0.0000005, true, 3)
ON CONFLICT (id) DO UPDATE SET server_allowed = EXCLUDED.server_allowed, default_rank = EXCLUDED.default_rank;
