import { AI_MODELS } from "@/lib/constants";

// 모델 목록을 사이드바 카테고리와 같은 묶음으로 보여준다.
// 사이드바에서 카테고리를 누르면 ?category=… 가 붙고, 그 묶음으로 스크롤한다.
// 모델은 한 묶음에만 — 가장 대표적인 쓰임새 기준. 표에 없는 모델은 맨 아래 "기타"로.
export const MODEL_SECTIONS: { slug: string; models: string[] }[] = [
  {
    slug: "llm",
    models: [
      "chatgpt", "claude", "gemini", "grok", "copilot", "meta-ai", "deepseek", "mistral", "qwen",
      "kimi-k2", "poe", "pi", "cohere", "doubao", "ernie", "hunyuan", "minimax", "solar",
    ],
  },
  { slug: "ai-ml", models: ["gemma", "glm", "exaone", "nemotron", "olmo", "huggingchat"] },
  {
    slug: "image-gen",
    models: [
      "midjourney", "nano-banana", "dall-e", "stable-diffusion", "flux", "ideogram", "adobe-firefly",
      "recraft", "krea", "reve",
    ],
  },
  {
    slug: "video-gen",
    models: ["sora", "veo", "kling", "runway", "luma", "hailuo", "pika", "higgsfield", "vidu", "pixverse", "hedra"],
  },
  { slug: "music-audio", models: ["suno", "udio", "elevenlabs", "fish-audio"] },
  {
    slug: "coding",
    models: [
      "github-copilot", "cursor", "claude-code", "codex", "windsurf", "gemini-cli", "cline", "devin",
      "replit", "lovable", "bolt", "v0", "trae", "kiro",
    ],
  },
  { slug: "ai-search", models: ["perplexity", "genspark", "phind", "kagi", "glean"] },
  { slug: "ai-agent", models: ["manus", "coze"] },
  { slug: "subtitle-translation", models: ["deepl"] },
  { slug: "design-ui", models: ["figma", "lovart"] },
  { slug: "productivity", models: ["notebooklm", "notion", "zapier", "n8n"] },
  { slug: "3d-spatial", models: ["meshy", "tripo"] },
];

// 묶음이 없는 사이드바 카테고리는 가장 가까운 묶음으로 보낸다
export const SECTION_FALLBACK: Record<string, string> = {
  all: "top",
  writing: "llm",
  education: "productivity",
};

/** 사이드바 카테고리별 모델 수 (Models 화면에서 사이드바 숫자로 쓴다). "all" = 전체 모델 수 */
export function modelCountsByCategory(): { counts: Record<string, number>; total: number } {
  const known = new Set<string>(AI_MODELS.map((m) => m.slug));
  const counts: Record<string, number> = {};
  for (const s of MODEL_SECTIONS) counts[s.slug] = s.models.filter((slug) => known.has(slug)).length;
  return { counts, total: AI_MODELS.length };
}
