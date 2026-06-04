-- Current by Jyos — Database Schema
-- Run this SQL in the Supabase SQL Editor to set up the database.
--
-- This schema is kept in sync with the application code:
--   - categories  ↔ CATEGORIES   in src/lib/constants.ts (14 rows)
--   - ai_models   ↔ AI_MODELS     in src/lib/constants.ts (37 rows)
--   - articles    ↔ DBArticleRow  in src/lib/transforms.ts
-- Articles are populated by the RSS crawler: `node scripts/crawl-articles.mjs`.

-- ============================================================
-- 1. CATEGORIES  (14 — matches CATEGORIES in constants.ts)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,                                          -- lucide-react icon name
  color TEXT,                                         -- hex color for UI badge
  category_group TEXT CHECK (category_group IN ('core','extended')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. AI MODELS  (24 — matches AI_MODELS in constants.ts;
--    category matches AIModelCategory in types.ts)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  brand_color TEXT,                                   -- hex color
  brand_color_secondary TEXT,                         -- hex color (gradient)
  category TEXT NOT NULL CHECK (category IN ('llm','image','code','search','multimodal','open-source')),
  logo_url TEXT,
  website_url TEXT,
  blog_url TEXT,
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
  source_url TEXT NOT NULL UNIQUE,                    -- UNIQUE: crawler dedupe key
  source_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ai_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  image_url TEXT,
  read_time INT DEFAULT 5,                            -- minutes
  view_count INT DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_ai_model ON articles(ai_model_id);

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

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

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
  handle TEXT,                                        -- e.g. "@karpathy"
  avatar_url TEXT,
  comment TEXT NOT NULL,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expert_comments_article ON expert_comments(article_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_comments ENABLE ROW LEVEL SECURITY;

-- Public read for content tables
CREATE POLICY "articles_select_public"        ON articles        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories_select_public"      ON categories      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ai_models_select_public"       ON ai_models       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "expert_comments_select_public" ON expert_comments FOR SELECT TO anon, authenticated USING (true);

-- Bookmarks: users can only access their own rows
CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Newsletter: anyone can subscribe; reads/deletes only via service_role (bypasses RLS)
CREATE POLICY "newsletter_insert_public" ON newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- NOTE: writing articles is intentionally NOT exposed to anon/authenticated.
-- The crawler (scripts/crawl-articles.mjs) inserts using the service_role key,
-- which bypasses RLS. There is therefore no articles INSERT policy here.

-- ============================================================
-- 8. SEED — categories (14)  [matches src/lib/constants.ts CATEGORIES]
-- ============================================================
INSERT INTO categories (slug, name, icon, color, category_group) VALUES
  ('ai-ml','AI / ML','brain','#3B82F6','core'),
  ('llm','LLM / 챗봇','message-square','#10B981','core'),
  ('image-gen','이미지 생성','image','#A855F7','core'),
  ('video-gen','비디오 생성','video','#EF4444','core'),
  ('music-audio','음악 / 오디오','music','#EC4899','core'),
  ('coding','코딩 / 개발','code','#6366F1','core'),
  ('ai-search','AI 검색','search','#14B8A6','core'),
  ('subtitle-translation','자막 / 번역','languages','#F59E0B','extended'),
  ('design-ui','디자인 / UI','palette','#F472B6','extended'),
  ('writing','글쓰기 / 콘텐츠','pen-tool','#FB923C','extended'),
  ('productivity','생산성 / 자동화','zap','#FACC15','extended'),
  ('ai-agent','AI 에이전트','bot','#22D3EE','extended'),
  ('3d-spatial','3D / 공간','box','#818CF8','extended'),
  ('education','교육 / 연구','graduation-cap','#34D399','extended')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 9. SEED — ai_models (37)  [matches src/lib/constants.ts AI_MODELS]
-- ============================================================
INSERT INTO ai_models (slug, name, company, description, brand_color, brand_color_secondary, category, website_url, blog_url) VALUES
  ('chatgpt','ChatGPT','OpenAI','Conversational AI assistant with GPT-5 Turbo','#10A37F','#1A7F5A','llm','https://chat.openai.com','https://openai.com/blog'),
  ('claude','Claude','Anthropic','AI assistant focused on safety and helpfulness','#D4A574','#8B6914','llm','https://claude.ai','https://www.anthropic.com/blog'),
  ('gemini','Gemini','Google','Multimodal AI model by Google DeepMind','#4285F4','#1A73E8','multimodal','https://gemini.google.com','https://blog.google/technology/ai/'),
  ('grok','Grok','xAI','AI assistant with real-time X integration','#1DA1F2','#0D8BD9','llm','https://grok.x.ai',NULL),
  ('copilot','Copilot','Microsoft','AI-powered assistant integrated across Microsoft products','#7B68EE','#5A4FCF','llm','https://copilot.microsoft.com',NULL),
  ('perplexity','Perplexity','Perplexity AI','AI-powered search engine with citations','#20B2AA','#1A8F88','search','https://perplexity.ai','https://blog.perplexity.ai'),
  ('deepseek','DeepSeek','DeepSeek','Open-source LLM with strong reasoning capabilities','#4169E1','#2850C8','open-source','https://deepseek.com',NULL),
  ('mistral','Mistral','Mistral AI','European open-source AI model leader','#FF6B35','#E55A2B','open-source','https://mistral.ai','https://mistral.ai/news'),
  ('meta-ai','Meta AI','Meta','Llama-based AI models and Meta AI assistant','#0668E1','#0550B5','open-source','https://ai.meta.com','https://ai.meta.com/blog/'),
  ('midjourney','Midjourney','Midjourney','AI image generation with artistic quality','#2C2C34','#1A1A22','image','https://midjourney.com',NULL),
  ('dall-e','DALL-E','OpenAI','Text-to-image AI model by OpenAI','#FF6F61','#E85A4F','image','https://openai.com/dall-e-3',NULL),
  ('stable-diffusion','Stable Diffusion','Stability AI','Open-source image generation model','#A855F7','#9333EA','image','https://stability.ai','https://stability.ai/blog'),
  ('flux','Flux','Black Forest Labs','Next-gen image model from ex-Stability AI team','#F59E0B','#D97706','image','https://blackforestlabs.ai',NULL),
  ('suno','Suno','Suno AI','AI music generation from text prompts','#EC4899','#DB2777','multimodal','https://suno.ai',NULL),
  ('runway','Runway','Runway','AI video generation and editing suite','#06B6D4','#0891B2','multimodal','https://runwayml.com','https://runwayml.com/blog'),
  ('pika','Pika','Pika Labs','AI video creation made accessible','#8B5CF6','#7C3AED','multimodal','https://pika.art',NULL),
  ('cursor','Cursor','Anysphere','AI-first code editor built on VS Code','#6366F1','#4F46E5','code','https://cursor.com','https://cursor.com/blog'),
  ('devin','Devin','Cognition','First autonomous AI software engineer','#14B8A6','#0D9488','code','https://devin.ai',NULL),
  ('replit','Replit','Replit','AI-powered collaborative coding platform','#F26522','#D4561D','code','https://replit.com','https://blog.replit.com'),
  ('v0','v0','Vercel','AI-powered UI component generator','#FFFFFF','#A0A0A0','code','https://v0.dev',NULL),
  ('bolt','Bolt','StackBlitz','AI full-stack web app builder in the browser','#F97316','#EA580C','code','https://bolt.new',NULL),
  ('lovable','Lovable','Lovable','AI-powered app builder for non-developers','#E11D48','#BE123C','code','https://lovable.dev',NULL),
  ('windsurf','Windsurf','Codeium','AI-powered IDE with deep codebase understanding','#22D3EE','#06B6D4','code','https://windsurf.com',NULL),
  ('notebooklm','NotebookLM','Google','AI research assistant for documents and notes','#FACC15','#EAB308','multimodal','https://notebooklm.google.com',NULL),
  -- Trending 2026 additions
  ('sora','Sora','OpenAI','Text-to-video model generating realistic clips with synchronized audio','#1A1A1A','#000000','multimodal','https://openai.com/sora','https://openai.com/index/sora-2/'),
  ('veo','Veo','Google DeepMind','Video generation model producing 1080p clips with native synchronized audio','#4285F4','#3367D6','multimodal','https://deepmind.google/models/veo/','https://developers.googleblog.com/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/'),
  ('kling','Kling','Kuaishou','Text- and image-to-video model known for cinematic realism and long durations','#00C2A8','#009E8A','multimodal','https://klingai.com',NULL),
  ('elevenlabs','ElevenLabs','ElevenLabs','AI voice platform for lifelike speech, voice cloning, and voice agents','#5B47E0','#4536B8','multimodal','https://elevenlabs.io','https://elevenlabs.io/blog'),
  ('manus','Manus','Butterfly Effect','Autonomous general-purpose AI agent that plans and executes multi-step tasks','#6C4DF6','#553BCB','multimodal','https://manus.im','https://manus.im/blog'),
  ('genspark','Genspark','Genspark','All-in-one AI Super Agent workspace orchestrating multiple models and tools','#FF5A1F','#D9430F','search','https://www.genspark.ai','https://www.genspark.ai/blog'),
  ('qwen','Qwen','Alibaba','Family of open-weight LLMs with strong multilingual and reasoning ability','#615CED','#4A45C4','open-source','https://qwen.ai','https://qwenlm.github.io/blog/'),
  ('kimi-k2','Kimi K2','Moonshot AI','Open-weight trillion-parameter MoE model built for agentic coding tasks','#374151','#1F2937','open-source','https://www.kimi.com','https://www.moonshot.ai'),
  ('ideogram','Ideogram','Ideogram','Text-to-image generator renowned for accurate in-image typography','#FF4D4D','#D93838','image','https://ideogram.ai','https://about.ideogram.ai'),
  ('recraft','Recraft','Recraft','AI design tool that generates production-ready vector SVGs and raster images','#E8463C','#C23129','image','https://www.recraft.ai','https://www.recraft.ai/blog'),
  ('glean','Glean','Glean','Enterprise Work AI platform for permissions-aware search and assistants','#343CED','#272EC4','search','https://www.glean.com','https://www.glean.com/blog'),
  ('cline','Cline','Cline','Open-source autonomous coding agent that runs in your IDE, terminal, or CI','#2E7D6F','#226054','code','https://cline.bot','https://cline.bot/blog'),
  ('higgsfield','Higgsfield','Higgsfield AI','Generative AI studio for cinematic social-media video with an AI Director','#7C3AED','#5F26B8','multimodal','https://higgsfield.ai','https://higgsfield.ai/blog')
ON CONFLICT (slug) DO NOTHING;
