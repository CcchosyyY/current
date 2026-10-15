import { AI_MODELS } from "@/lib/constants";
import type { AIModel } from "@/lib/types";

// 홈 "AI Models" 칸 — 카테고리를 고르면 그 분야에서 "사용자가 많은" 순서로 8개.
// 실시간 사용자 데이터는 없으므로, 공개된 사용자 규모(MAU·가입자 수 발표, 앱 다운로드 순위 등)를
// 바탕으로 정한 추정 순서를 손으로 관리한다 (2026-10 기준). 순서를 바꾸려면 이 표만 고치면 된다.
// "전체"는 여기 없음 — 홈에서 유명한 8개(FEATURED_SLUGS)를 그대로 보여준다.

const BY_USERS: Record<string, string[]> = {
  "ai-ml": ["chatgpt", "gemini", "meta-ai", "copilot", "deepseek", "claude", "grok", "perplexity"],
  llm: ["chatgpt", "gemini", "meta-ai", "copilot", "deepseek", "grok", "claude", "qwen"],
  "image-gen": ["gemini", "dall-e", "midjourney", "stable-diffusion", "flux", "ideogram", "recraft", "meta-ai"],
  "video-gen": ["sora", "veo", "kling", "hailuo", "runway", "luma", "pika", "higgsfield"],
  "music-audio": ["suno", "elevenlabs", "udio", "notebooklm", "fish-audio", "chatgpt", "gemini", "copilot"],
  coding: ["github-copilot", "cursor", "claude-code", "codex", "replit", "lovable", "windsurf", "bolt"],
  "ai-search": ["chatgpt", "gemini", "perplexity", "copilot", "grok", "genspark", "claude", "glean"],
  "subtitle-translation": ["deepl", "chatgpt", "gemini", "copilot", "claude", "elevenlabs", "deepseek", "qwen"],
  "design-ui": ["figma", "adobe-firefly", "midjourney", "lovable", "v0", "recraft", "lovart", "ideogram"],
  writing: ["chatgpt", "gemini", "copilot", "claude", "notion", "deepl", "meta-ai", "deepseek"],
  productivity: ["copilot", "chatgpt", "notion", "gemini", "notebooklm", "zapier", "n8n", "glean"],
  "ai-agent": ["chatgpt", "gemini", "claude", "copilot", "manus", "genspark", "coze", "n8n"],
  "3d-spatial": ["meshy", "tripo", "hunyuan", "gemini", "chatgpt", "stable-diffusion", "luma", "runway"],
  education: ["chatgpt", "gemini", "notebooklm", "copilot", "claude", "perplexity", "deepseek", "meta-ai"],
};

/** 카테고리의 사용자 많은 순 모델. 표에 없는 카테고리면 null (→ 홈 기본 8개) */
export function modelsByUsers(category: string | null): AIModel[] | null {
  const slugs = category ? BY_USERS[category] : undefined;
  if (!slugs) return null;
  const bySlug = new Map<string, AIModel>(AI_MODELS.map((m) => [m.slug, m]));
  return slugs.map((s) => bySlug.get(s)).filter((m): m is AIModel => !!m);
}
