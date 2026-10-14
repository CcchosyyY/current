-- 비교 실행 보강 (docs/plan-stage1.md S6·S7)

-- 1. 블라인드 구멍 막기 (R-8)
--    사용자가 자기 세션 토큰으로 Supabase REST에 직접 runs·comparisons를 조회하면
--    선택 전에 requested_model_id / model_order로 모델을 알아낼 수 있다.
--    → 두 테이블은 사용자 직접 조회를 막고, 블라인드 규칙을 적용하는 서버 API로만 읽는다.
DROP POLICY IF EXISTS "comparisons_select_own" ON comparisons;
DROP POLICY IF EXISTS "runs_select_own" ON runs;

-- 2. 비교를 만들 때 섞은 모델 순서 (index = 표시 위치 0=A, 1=B …, R-9)
ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS model_order TEXT[] NOT NULL DEFAULT '{}';

-- 3. 같은 비교를 두 번 실행하지 않기 (버튼 두 번 → 비용 두 번 방지)
--    /run이 위치마다 runs 행을 먼저 넣는다. 두 번째 요청은 여기서 막힌다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_runs_comparison_position
  ON runs(comparison_id, display_position) WHERE comparison_id IS NOT NULL;
