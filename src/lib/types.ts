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
  | "notebooklm";

export interface Category {
  slug: CategorySlug;
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
  | "writing"
  | "productivity"
  | "ai-agent"
  | "3d-spatial"
  | "education";

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
export type TrendingPeriod = "today" | "this-week" | "this-month";

export type AIModelFilter = "all" | AIModelCategory;
