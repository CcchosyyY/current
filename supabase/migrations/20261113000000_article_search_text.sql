-- 기사 검색: 원문(영어) + 한국어 번역을 합친 글자 묶음에서 부분 일치로 찾는다 (/api/articles ?search=)
-- 기존 search_vector(english 전문검색)는 영어 원문만 담아 한국어 검색어("보안", "해킹")가 하나도 안 걸렸고,
-- "GPT-5"처럼 하이픈이 든 이름도 단어가 쪼개져 거의 안 걸렸다. pg_trgm 인덱스로 ILIKE '%단어%'를 빠르게.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_text TEXT
  GENERATED ALWAYS AS (
    coalesce(title, '') || ' ' || coalesce(title_ko, '') || ' ' ||
    coalesce(summary, '') || ' ' || coalesce(summary_ko, '') || ' ' ||
    coalesce(content, '') || ' ' || coalesce(content_ko, '')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_articles_search_text
  ON articles USING GIN (search_text extensions.gin_trgm_ops);
