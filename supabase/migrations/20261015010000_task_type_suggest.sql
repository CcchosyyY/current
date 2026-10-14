-- 작업 유형 자동완성 (docs/plan-stage1.md S5, 이야기 2의 ③)
--
-- 유형별 비교 횟수는 모든 사용자의 comparisons를 세야 하는데, 사용자 세션은 RLS로
-- 자기 비교만 본다. 그래서 집계만 돌려주는 SECURITY DEFINER 함수로 두고,
-- 실행 권한은 서버(service role)에만 준다. 샘플·사용자 정보는 반환하지 않는다.
--
-- 글자 유사도(pg_trgm)는 "사용자가 치는 글자"와 유형 이름을 맞추는 데만 쓴다.
-- 의미로 묶는 일(자소서 다듬기 → 문장 교정)은 판정 AI가 한다 (S1 실측: 둘의 유사도 0).

CREATE OR REPLACE FUNCTION public.suggest_task_types(q text, max_results int DEFAULT 8)
RETURNS TABLE (id uuid, key text, name text, comparisons bigint, score real)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT t.id, t.key, t.name,
         (SELECT count(*) FROM comparisons c WHERE c.task_type_id = t.id) AS comparisons,
         GREATEST(
           similarity(t.name, q),
           CASE WHEN t.name ILIKE q || '%' THEN 1.0 ELSE 0 END,
           CASE WHEN t.name ILIKE '%' || q || '%' THEN 0.8 ELSE 0 END
         )::real AS score
  FROM task_types t
  WHERE t.merged_into IS NULL
    AND NOT t.is_unclassified
    AND (q = '' OR t.name ILIKE '%' || q || '%' OR similarity(t.name, q) > 0.2)
  ORDER BY score DESC, comparisons DESC, t.name
  LIMIT max_results;
$$;

REVOKE EXECUTE ON FUNCTION public.suggest_task_types(text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_task_types(text, int) TO service_role;
