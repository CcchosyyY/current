-- Current by Jyos — Database Schema
-- Run this SQL in Supabase SQL Editor to set up the database.

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,           -- emoji or icon name
  color TEXT,          -- hex color for UI badge
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. AI MODELS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  brand_color TEXT,                         -- hex color
  category TEXT NOT NULL CHECK (category IN ('chatbot', 'image', 'video', 'coding', 'music', 'other')),
  logo_url TEXT,
  latest_model TEXT,                        -- e.g. "claude-4-opus"
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ai_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL
);

CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_ai_model ON articles(ai_model_id);

-- ============================================================
-- 4. BOOKMARKS (requires auth — protected by RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, article_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- ============================================================
-- 5. NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- ============================================================
-- 6. EXPERT COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS expert_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_name TEXT NOT NULL,
  handle TEXT,                              -- e.g. "@karpathy"
  avatar_url TEXT,
  comment TEXT NOT NULL,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_expert_comments_article ON expert_comments(article_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_comments ENABLE ROW LEVEL SECURITY;

-- ARTICLES: public read
CREATE POLICY "articles_select_public"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (true);

-- CATEGORIES: public read
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- AI MODELS: public read
CREATE POLICY "ai_models_select_public"
  ON ai_models FOR SELECT
  TO anon, authenticated
  USING (true);

-- EXPERT COMMENTS: public read
CREATE POLICY "expert_comments_select_public"
  ON expert_comments FOR SELECT
  TO anon, authenticated
  USING (true);

-- BOOKMARKS: users can only access their own rows
CREATE POLICY "bookmarks_select_own"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- NEWSLETTER SUBSCRIBERS: anyone can subscribe, only service_role can read/delete
-- (anon INSERT is enough; admin uses service_role key which bypasses RLS)
CREATE POLICY "newsletter_insert_public"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- 8. SEED DATA — default categories
-- ============================================================
INSERT INTO categories (name, slug, icon, color) VALUES
  ('AI General',   'ai-general',   'brain',    '#8B5CF6'),
  ('Chatbot',      'chatbot',      'message',  '#3B82F6'),
  ('Image AI',     'image-ai',     'image',    '#EC4899'),
  ('Video AI',     'video-ai',     'video',    '#F59E0B'),
  ('Coding AI',    'coding-ai',    'code',     '#10B981'),
  ('Music AI',     'music-ai',     'music',    '#EF4444'),
  ('Research',     'research',     'flask',    '#6366F1'),
  ('Industry',     'industry',     'building', '#64748B')
ON CONFLICT (slug) DO NOTHING;

-- Seed: major AI models
INSERT INTO ai_models (name, company, description, brand_color, category, latest_model, website_url) VALUES
  ('Claude',   'Anthropic', 'Anthropic''s helpful, harmless, and honest AI assistant', '#D97706', 'chatbot', 'claude-4-opus',   'https://claude.ai'),
  ('ChatGPT',  'OpenAI',    'OpenAI''s conversational AI model',                       '#10A37F', 'chatbot', 'gpt-4o',          'https://chat.openai.com'),
  ('Gemini',   'Google',    'Google DeepMind''s multimodal AI model',                  '#4285F4', 'chatbot', 'gemini-2.5-pro',  'https://gemini.google.com'),
  ('Midjourney','Midjourney','AI image generation tool',                                '#000000', 'image',   'v6.1',            'https://midjourney.com'),
  ('DALL-E',   'OpenAI',    'OpenAI''s image generation model',                        '#10A37F', 'image',   'dall-e-3',        'https://openai.com'),
  ('Sora',     'OpenAI',    'OpenAI''s video generation model',                        '#10A37F', 'video',   'sora',            'https://openai.com'),
  ('Copilot',  'GitHub',    'AI pair programmer powered by OpenAI',                    '#000000', 'coding',  'copilot',         'https://github.com/features/copilot'),
  ('Suno',     'Suno',      'AI music generation platform',                            '#000000', 'music',   'v4',              'https://suno.ai')
ON CONFLICT DO NOTHING;
