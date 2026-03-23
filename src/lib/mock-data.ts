import type { Article, NewsletterIssue } from "./types";

// Mock articles for dashboard
export const TODAYS_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Claude 4 Opus Launches with 1M Token Context Window",
    summary:
      "Anthropic releases Claude 4 Opus with unprecedented context length and improved reasoning capabilities across all benchmarks.",
    content: `Anthropic has officially launched Claude 4 Opus, the latest iteration of their frontier AI model. The new model features a groundbreaking 1 million token context window, allowing users to process entire codebases, lengthy documents, and complex multi-step tasks in a single conversation.

Key improvements include enhanced reasoning capabilities, better instruction following, and significant advances in coding and mathematical problem-solving. In benchmark tests, Claude 4 Opus outperformed previous models across all major evaluation suites.

The model also introduces improved safety features, including better refusal calibration and reduced hallucination rates. Anthropic emphasized their commitment to responsible AI development, noting that the model underwent extensive red-teaming before release.

Claude 4 Opus is available immediately through the Anthropic API and Claude.ai, with pricing starting at $15 per million input tokens and $75 per million output tokens.`,
    source: "Anthropic Blog",
    sourceUrl: "https://anthropic.com/blog",
    imageUrl: "https://placehold.co/600x400/3B82F6/FAFAFA?text=Claude+4",
    category: "claude",
    aiModel: "claude",
    publishedAt: "2026-03-23T09:00:00Z",
    createdAt: "2026-03-23T09:00:00Z",
    readTime: 5,
    viewCount: 12400,
    isTrending: true,
    tags: ["Claude", "Anthropic", "LLM", "Context Window"],
  },
  {
    id: "2",
    title: "OpenAI Announces GPT-5 Turbo with Real-Time Video Understanding",
    summary:
      "GPT-5 Turbo brings native video understanding and real-time multimodal processing to the ChatGPT platform.",
    content:
      "OpenAI has announced GPT-5 Turbo, featuring native real-time video understanding capabilities. The model can process video streams in real time, enabling new applications in content moderation, accessibility, and interactive media.",
    source: "OpenAI Blog",
    sourceUrl: "https://openai.com/blog",
    imageUrl: "https://placehold.co/600x400/10A37F/FAFAFA?text=GPT-5",
    category: "chatgpt",
    aiModel: "chatgpt",
    publishedAt: "2026-03-23T07:00:00Z",
    createdAt: "2026-03-23T07:00:00Z",
    readTime: 7,
    viewCount: 18200,
    isTrending: true,
    tags: ["GPT-5", "OpenAI", "Video AI", "Multimodal"],
  },
  {
    id: "3",
    title: "Google DeepMind Unveils Gemini 2.5 Ultra with Scientific Reasoning",
    summary:
      "Gemini 2.5 Ultra achieves new state-of-the-art results in scientific reasoning and mathematical proofs.",
    content:
      "Google DeepMind has unveiled Gemini 2.5 Ultra, pushing the boundaries of AI scientific reasoning...",
    source: "Google AI Blog",
    sourceUrl: "https://blog.google/technology/ai/",
    imageUrl: "https://placehold.co/600x400/4285F4/FAFAFA?text=Gemini+2.5",
    category: "gemini",
    aiModel: "gemini",
    publishedAt: "2026-03-23T05:00:00Z",
    createdAt: "2026-03-23T05:00:00Z",
    readTime: 6,
    viewCount: 9800,
    isTrending: true,
    tags: ["Gemini", "Google", "Scientific AI", "Reasoning"],
  },
  {
    id: "4",
    title: "Meta Releases Llama 4 as Open Source with MoE Architecture",
    summary:
      "Llama 4 uses a Mixture of Experts architecture, offering GPT-4 level performance with open weights.",
    content:
      "Meta has released Llama 4, their latest open-source language model featuring a Mixture of Experts architecture...",
    source: "Meta AI Blog",
    sourceUrl: "https://ai.meta.com/blog/",
    imageUrl: "https://placehold.co/600x400/0668E1/FAFAFA?text=Llama+4",
    category: "ai-ml",
    aiModel: "meta-ai",
    publishedAt: "2026-03-23T03:00:00Z",
    createdAt: "2026-03-23T03:00:00Z",
    readTime: 8,
    viewCount: 15600,
    isTrending: true,
    tags: ["Llama", "Meta", "Open Source", "MoE"],
  },
  {
    id: "5",
    title:
      "Stability AI Launches Stable Diffusion 4 with Native Video Generation",
    summary:
      "SD4 introduces seamless image-to-video generation with consistent character and style preservation.",
    content:
      "Stability AI has launched Stable Diffusion 4, their most ambitious release to date with native video generation capabilities...",
    source: "Stability AI",
    sourceUrl: "https://stability.ai/blog",
    imageUrl: "https://placehold.co/600x400/7C3AED/FAFAFA?text=SD4",
    category: "ai-ml",
    aiModel: "stable-diffusion",
    publishedAt: "2026-03-22T20:00:00Z",
    createdAt: "2026-03-22T20:00:00Z",
    readTime: 4,
    viewCount: 7200,
    isTrending: false,
    tags: ["Stable Diffusion", "Image AI", "Video Generation"],
  },
];

// Trending articles (reuse + extras)
export const TRENDING_ARTICLES: Article[] = [
  ...TODAYS_ARTICLES,
  {
    id: "6",
    title: "EU Passes Comprehensive AI Regulation Framework",
    summary:
      "The European Union finalizes the AI Act with strict requirements for frontier AI models.",
    content:
      "The EU has passed one of the most comprehensive AI regulations to date...",
    source: "Reuters",
    sourceUrl: "https://reuters.com",
    imageUrl: "https://placehold.co/600x400/EF4444/FAFAFA?text=EU+AI+Act",
    category: "global-news",
    aiModel: null,
    publishedAt: "2026-03-22T18:00:00Z",
    createdAt: "2026-03-22T18:00:00Z",
    readTime: 6,
    viewCount: 8400,
    isTrending: true,
    tags: ["EU", "AI Regulation", "Policy"],
  },
  {
    id: "7",
    title: "Cursor AI Hits 10M Active Users",
    summary:
      "The AI-first code editor celebrates 10 million active developers on its platform.",
    content: "Cursor has reached a major milestone with 10 million active users...",
    source: "TechCrunch",
    sourceUrl: "https://techcrunch.com",
    imageUrl: "https://placehold.co/600x400/6366F1/FAFAFA?text=Cursor",
    category: "ai-ml",
    aiModel: "cursor",
    publishedAt: "2026-03-22T15:00:00Z",
    createdAt: "2026-03-22T15:00:00Z",
    readTime: 3,
    viewCount: 6100,
    isTrending: true,
    tags: ["Cursor", "Coding AI", "Developer Tools"],
  },
];

// Saved articles
export const SAVED_ARTICLES: Article[] = [
  TODAYS_ARTICLES[0],
  TODAYS_ARTICLES[1],
  {
    id: "s3",
    title: "Understanding Transformer Architecture in 2026",
    summary:
      "A deep dive into how modern transformer architectures have evolved beyond attention.",
    content: "Transformers have undergone significant evolution since their introduction...",
    source: "arXiv",
    sourceUrl: "https://arxiv.org",
    imageUrl: "https://placehold.co/600x400/7C3AED/FAFAFA?text=Transformers",
    category: "ai-ml",
    aiModel: null,
    publishedAt: "2026-03-22T10:00:00Z",
    createdAt: "2026-03-22T10:00:00Z",
    readTime: 12,
    viewCount: 4500,
    isTrending: false,
    tags: ["Transformers", "Research", "Architecture"],
  },
  {
    id: "s4",
    title: "Cursor AI Hits 10M Users Milestone",
    summary: "The AI-first code editor celebrates reaching 10 million active users.",
    content: "Cursor has celebrated a major milestone...",
    source: "TechCrunch",
    sourceUrl: "https://techcrunch.com",
    imageUrl: "https://placehold.co/600x400/6366F1/FAFAFA?text=Cursor",
    category: "ai-ml",
    aiModel: "cursor",
    publishedAt: "2026-03-21T08:00:00Z",
    createdAt: "2026-03-21T08:00:00Z",
    readTime: 3,
    viewCount: 6100,
    isTrending: false,
    tags: ["Cursor", "Developer Tools"],
  },
  {
    id: "s5",
    title: "The Future of AI Agents in Software Development",
    summary:
      "How autonomous AI agents are reshaping the software engineering workflow.",
    content: "AI agents are changing the way software is built...",
    source: "Hacker News",
    sourceUrl: "https://news.ycombinator.com",
    imageUrl: "https://placehold.co/600x400/F59E0B/FAFAFA?text=AI+Agents",
    category: "ai-ml",
    aiModel: null,
    publishedAt: "2026-03-20T14:00:00Z",
    createdAt: "2026-03-20T14:00:00Z",
    readTime: 8,
    viewCount: 5300,
    isTrending: false,
    tags: ["AI Agents", "Software Development"],
  },
  {
    id: "s6",
    title: "Stability AI Launches Stable Diffusion 4",
    summary: "SD4 introduces seamless image-to-video generation.",
    content: "Stable Diffusion 4 is here with video generation...",
    source: "Stability AI",
    sourceUrl: "https://stability.ai",
    imageUrl: "https://placehold.co/600x400/EF4444/FAFAFA?text=SD4",
    category: "ai-ml",
    aiModel: "stable-diffusion",
    publishedAt: "2026-03-19T11:00:00Z",
    createdAt: "2026-03-19T11:00:00Z",
    readTime: 4,
    viewCount: 7200,
    isTrending: false,
    tags: ["Stable Diffusion", "Image AI"],
  },
];

// Expert insights
export const EXPERT_INSIGHTS = [
  {
    id: "e1",
    name: "Andrej Karpathy",
    handle: "@karpathy",
    avatar: "AK",
    quote:
      "The pace of AI progress in 2026 is unlike anything we've seen. We're not just improving models — we're fundamentally changing how software is built.",
    source: "X (Twitter)",
  },
  {
    id: "e2",
    name: "Sam Altman",
    handle: "@sama",
    avatar: "SA",
    quote:
      "AGI is closer than most people think. The next generation of models will surprise even the optimists.",
    source: "X (Twitter)",
  },
];

// Newsletter issues
export const NEWSLETTER_ISSUES: NewsletterIssue[] = [
  {
    id: "nl1",
    title: "Current Weekly #12 — Claude 4, GPT-5, and the Race to AGI",
    summary: "This week saw major releases from both Anthropic and OpenAI...",
    publishedAt: "2026-03-23",
    articleIds: ["1", "2", "3"],
  },
  {
    id: "nl2",
    title: "Current Weekly #11 — Open Source AI Models Catching Up",
    summary:
      "Meta's Llama 4 and Mistral's new model challenge proprietary offerings...",
    publishedAt: "2026-03-16",
    articleIds: ["4"],
  },
  {
    id: "nl3",
    title: "Current Weekly #10 — AI Regulation Update: EU AI Act",
    summary:
      "The EU finalizes comprehensive AI regulation with implications for global tech...",
    publishedAt: "2026-03-09",
    articleIds: ["6"],
  },
  {
    id: "nl4",
    title: "Current Weekly #9 — AI in Creative Industries",
    summary:
      "Sora, Runway, and the evolution of AI-generated video content...",
    publishedAt: "2026-03-02",
    articleIds: ["5"],
  },
  {
    id: "nl5",
    title: "Current Weekly #8 — Coding AI Tools Comparison 2026",
    summary:
      "Cursor vs GitHub Copilot vs Claude Code — which is best for developers?",
    publishedAt: "2026-02-23",
    articleIds: [],
  },
];

// Hardcoded "now" for consistent mock data filtering
export const MOCK_NOW = new Date("2026-03-23T12:00:00Z");

// Helper: get relative time string
export function getRelativeTime(dateStr: string): string {
  const now = MOCK_NOW;
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  return `${diffDays}d ago`;
}

// Helper: get all articles by ID
export function getArticleById(id: string): Article | undefined {
  return [...TODAYS_ARTICLES, ...TRENDING_ARTICLES, ...SAVED_ARTICLES].find(
    (a) => a.id === id
  );
}
