// Core data types for the Current platform

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: CategorySlug;
  aiModel: AIModelSlug | null;
  publishedAt: string;
  createdAt: string;
  readTime: number; // minutes
  viewCount: number;
  isTrending: boolean;
  tags: string[];
  hotType: HotType | null;
  hotReason: string | null;
}

// Hot = 지금 주목해야 하는 기사 (크롤러 Hot 판정 단계가 채움)
export type HotType = "model_release" | "breaking";

// 같은 사건을 다룬 Hot 기사 묶음 (articles.hot_event 기준). 카드 하나 = 사건 하나.
export interface HotEvent {
  key: string;
  type: HotType;
  reason: string;
  firstAt: string; // 사건의 첫 기사 시각 — 노출 기간은 여기서부터 잰다
  lead: Article; // 대표 기사 = 가장 먼저 나온 기사
  articles: Pick<Article, "id" | "title" | "source" | "publishedAt">[]; // 대표 포함, 오래된 순
}

export interface AIModel {
  slug: AIModelSlug;
  name: string;
  company: string;
  description: string;
  color: string; // gradient or solid color for the card
  colorSecondary?: string; // secondary color for gradient
  category: AIModelCategory;
  websiteUrl: string;
  blogUrl: string | null;
}

export type AIModelCategory =
  | "llm"
  | "image"
  | "code"
  | "search"
  | "multimodal"
  | "open-source";

export type AIModelSlug =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "copilot"
  | "perplexity"
  | "deepseek"
  | "mistral"
  | "meta-ai"
  | "midjourney"
  | "dall-e"
  | "stable-diffusion"
  | "flux"
  | "suno"
  | "runway"
  | "pika"
  | "cursor"
  | "devin"
  | "replit"
  | "v0"
  | "bolt"
  | "lovable"
  | "windsurf"
  | "notebooklm"
  // Trending 2026 additions
  | "sora"
  | "veo"
  | "kling"
  | "elevenlabs"
  | "manus"
  | "genspark"
  | "qwen"
  | "kimi-k2"
  | "ideogram"
  | "recraft"
  | "glean"
  | "cline"
  | "higgsfield"
  | "poe"
  | "pi"
  | "cohere"
  | "doubao"
  | "ernie"
  | "hunyuan"
  | "glm"
  | "minimax"
  | "solar"
  | "exaone"
  | "gemma"
  | "nemotron"
  | "huggingchat"
  | "olmo"
  | "adobe-firefly"
  | "krea"
  | "nano-banana"
  | "reve"
  | "luma"
  | "hailuo"
  | "vidu"
  | "pixverse"
  | "hedra"
  | "udio"
  | "fish-audio"
  | "claude-code"
  | "codex"
  | "github-copilot"
  | "trae"
  | "kiro"
  | "gemini-cli"
  | "phind"
  | "kagi"
  | "coze"
  | "notion"
  | "zapier"
  | "n8n"
  | "figma"
  | "lovart"
  | "deepl"
  | "meshy"
  | "tripo";

export interface Category {
  slug: CategorySlug | "all";
  name: string;
  icon: string; // lucide-react icon name
  color: string; // hex color for icon background
  group: "core" | "extended";
}

export type CategorySlug =
  | "ai-ml"
  | "llm"
  | "image-gen"
  | "video-gen"
  | "music-audio"
  | "coding"
  | "ai-search"
  | "subtitle-translation"
  | "design-ui"
  | "productivity"
  | "ai-agent"
  | "3d-spatial";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isPremium: boolean;
  savedArticleIds: string[];
  preferredCategories: CategorySlug[];
  createdAt: string;
}

export interface NewsletterIssue {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  articleIds: string[];
}

// Filter / UI state types

export type AIModelFilter = "all" | AIModelCategory;
