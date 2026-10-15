-- 기사 한국어 번역 (scripts/lib/translate.mjs — 크롤러가 새 기사를, scripts/translate-articles.mjs가 기존 기사를 채운다)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS title_ko      TEXT,
  ADD COLUMN IF NOT EXISTS summary_ko    TEXT,
  ADD COLUMN IF NOT EXISTS content_ko    TEXT,
  ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_articles_untranslated ON articles (published_at DESC) WHERE translated_at IS NULL;
