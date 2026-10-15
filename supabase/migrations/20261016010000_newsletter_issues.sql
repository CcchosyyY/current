-- 매일 아침 크롤 뒤 만드는 뉴스레터 (scripts/newsletter.mjs). 하루 한 호.
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_date    DATE NOT NULL UNIQUE,              -- 한국 날짜
  title         TEXT NOT NULL,
  intro         TEXT NOT NULL,
  items         JSONB NOT NULL,                    -- [{article_id, headline, summary, why, title, source, url, category, model}]
  article_count INT NOT NULL,                      -- 후보로 본 기사 수 (최근 24시간)
  model         TEXT NOT NULL,                     -- 요약에 쓴 Claude 모델
  sent_at       TIMESTAMPTZ,                       -- 메일 발송 완료 시각 (없으면 미발송)
  sent_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_date ON newsletter_issues (issue_date DESC);

ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;
-- 누구나 읽기 (사이트에 공개). 쓰기는 서버 키(스크립트)만 — 정책 없음 = 거부.
DROP POLICY IF EXISTS newsletter_issues_select_public ON newsletter_issues;
CREATE POLICY newsletter_issues_select_public ON newsletter_issues FOR SELECT TO anon, authenticated USING (true);

-- 구독 해지 링크용 토큰 (메일마다 붙는다)
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS uq_newsletter_subscribers_unsub ON newsletter_subscribers (unsubscribe_token);
