// Current by Jyos — RSS article crawler
//
// Fetches AI-news RSS feeds, normalizes each item into an `articles` row,
// auto-classifies category + AI model by keyword, and upserts into Supabase
// (dedupe on source_url). Always writes a JSON snapshot to scripts/crawled-articles.json.
//
// Usage:
//   node scripts/crawl-articles.mjs          # crawl + upsert into Supabase
//   node scripts/crawl-articles.mjs --dry    # crawl + write JSON only (no DB write)
//
// Auth: uses SUPABASE_SERVICE_ROLE_KEY if present (recommended for production /
// cron), otherwise falls back to the public anon key from .env.local. The anon
// path needs a temporary `articles INSERT` RLS policy for anon (see README).

import Parser from "rss-parser";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load env from .env.local ───────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
    const out = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return out;
  } catch {
    return {};
  }
}
const fileEnv = loadEnv();
const SUPABASE_URL =
  process.env.SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY || "";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const KEY = SERVICE_KEY || ANON_KEY;
const DRY = process.argv.includes("--dry");
// Writing articles should use the service-role key (bypasses RLS). Using the
// public anon key requires a temporary anon INSERT policy and is a foot-gun, so
// it must be opted into explicitly.
const ALLOW_ANON = process.argv.includes("--allow-anon-insert");

// ── Feeds ──────────────────────────────────────────────────────────────────
const FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", source: "The Verge" },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", source: "Wired" },
  { url: "https://arstechnica.com/ai/feed/", source: "Ars Technica" },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat" },
  { url: "https://www.technologyreview.com/topic/artificial-intelligence/feed/", source: "MIT Technology Review" },
];

const PER_FEED = 12; // cap items per feed
const TOTAL_CAP = 70; // overall cap

// ── Classification keyword maps ────────────────────────────────────────────
// AI model slug ← keyword(s). Order matters: first match wins.
// Tag a model ONLY when the article is actually ABOUT that product/vendor.
// Avoid bare substrings ("openai"/"anthropic" as a backend, "cline" inside
// "decline") — prefer possessive/subject forms and multi-word product phrases.
const MODEL_RULES = [
  // App / agent builders first — often the subject even when a foundation model is the backend
  ["lovable", ["lovable"]],
  ["devin", ["devin", "cognition labs"]],
  ["replit", ["replit"]],
  ["v0", ["v0.dev", "v0 by vercel"]],
  ["bolt", ["bolt.new", "stackblitz"]],
  ["windsurf", ["windsurf", "codeium"]],
  ["cursor", ["cursor ai", "cursor editor", "by cursor", "anysphere"]],
  ["cline", [" cline ", "cline ai", "cline cli"]],
  // Trending 2026 products — specific phrases; vendor-bearing ones (sora/veo) sit BEFORE the foundation models
  ["genspark", ["genspark"]],
  ["manus", ["manus ai", "manus agent", "butterfly effect"]],
  ["glean", ["glean ai", "glean's", "glean raises", "by glean"]],
  ["ideogram", ["ideogram"]],
  ["recraft", ["recraft"]],
  ["higgsfield", ["higgsfield"]],
  ["elevenlabs", ["elevenlabs", "eleven labs", "eleven v3"]],
  ["suno", ["suno"]],
  ["kling", ["kling ai", "kling 2", "kling 3", "kuaishou"]],
  ["runway", ["runwayml", "runway gen", "runway ml", "runway's"]],
  ["pika", ["pika labs", "pika 1", "pika 2"]],
  ["sora", ["sora 2", "openai sora", "sora video", "sora app"]],
  ["veo", ["veo 3", "veo 2", "google veo", "veo model"]],
  ["qwen", ["qwen"]],
  ["kimi-k2", ["kimi k2", "kimi-k2", "moonshot ai", "kimi k"]],
  // First-party foundation model families
  ["claude", ["claude", "anthropic's", "by anthropic", "anthropic released", "anthropic launches", "anthropic report"]],
  ["dall-e", ["dall-e", "dall·e", "dalle"]],
  ["chatgpt", ["chatgpt", "gpt-5", "gpt-4", "gpt-4o", "openai's", "by openai", "openai released", "openai launches", "sam altman"]],
  ["gemini", ["gemini", "google deepmind", "deepmind", "gemma", "bard", "google ai studio"]],
  ["grok", ["grok", "x.ai", "grok imagine"]],
  ["copilot", ["github copilot", "microsoft copilot", "copilot"]],
  ["perplexity", ["perplexity"]],
  ["deepseek", ["deepseek"]],
  ["mistral", ["mistral"]],
  ["meta-ai", ["meta ai", "meta's ai", "llama ", "meta llama", "muse spark"]],
  ["midjourney", ["midjourney"]],
  ["stable-diffusion", ["stable diffusion", "stability ai", "stability.ai"]],
  ["flux", ["black forest labs", "flux.1", "flux model"]],
  ["notebooklm", ["notebooklm"]],
];

// category slug ← keyword(s). Ordered most-specific first; intent categories
// (ai-search, ai-agent) come BEFORE medium ones (image-gen, music-audio, coding)
// so a search/agent story with a stray dev/audio token isn't mis-bucketed.
// Keywords are matched against " " + text + " ", so prefer multi-word phrases
// and explicit-space tokens to avoid substring false positives ("ide " in
// "guide"/"inside", bare "code"/"voice"/"music").
const CATEGORY_RULES = [
  ["video-gen", ["video generation", "text-to-video", "image-to-video", "video model", "ai video", "video diffusion", "sora 2", "veo 3", "kling ai", "runway gen"]],
  ["image-gen", ["image generation", "text-to-image", "midjourney", "dall-e", "dall·e", "stable diffusion", "flux.1", "ideogram", "recraft", "ai image", "image model", "image-generation"]],
  ["music-audio", ["ai music", "music generation", "music startup", "suno", "elevenlabs", "text-to-speech", " tts ", "speech synthesis", "voice ai", "voice clon", "voice model", "song generation", "audio generation"]],
  ["ai-search", ["ai search", "ai overview", "ai mode", "perplexity", "search engine", "search results", "search console", "retrieval-augmented", " rag "]],
  ["ai-agent", ["ai agent", "ai agents", "agentic", "autonomous agent", "autonomous background agent", "agent for", "agent capability"]],
  ["subtitle-translation", ["subtitle", "subtitles", "machine translation", " translate ", "translation model", "multilingual model", "dubbing"]],
  ["design-ui", ["design tool", "ui design", "ux design", "figma", "prototyping tool", "design system"]],
  ["3d-spatial", ["robotics startup", "humanoid", " robot ", " robots ", "spatial comput", "3d model", "world model", "self-driving", "autonomous vehicle"]],
  ["writing", ["writing assistant", "copywriting", "content generation", "ai writing", "drafting documents"]],
  ["coding", ["ai coding", "coding model", "coding assistant", "coding tool", "code generation", "code completion", "ai pair programmer", "vibe code", "vibe-coded", "github copilot", "claude code", "software developer", "writing code", "developer tool", "competitive programming", "code editor"]],
  ["education", ["research paper", "study finds", "working paper", "university", "scientists", "mathematicians", "education", "tutor", "ai for science"]],
  ["productivity", ["productivity", "workflow automation", "enterprise ai", "back-office", "automate complex", "workplace ai", "operating model", "expense report"]],
  // Industry / business topics — placed before the generic `llm` bucket so AI
  // industry news (funding, data centers, regulation) is captured. Ordered
  // specific → broad (business' funding/investor terms are widest, so it's last).
  ["infrastructure", ["data center", "data centers", "datacenter", "data-center", " compute ", "gpu cluster", "h100", "h200", "blackwell", "power grid", "electricity demand", "energy demand", "water use", "cooling system", "server farm", "cloud capacity", "cloud infrastructure", "ai-native", "ai infrastructure", "supercomputer"]],
  ["security", ["data breach", "hacked", " hack ", "hacker", "cyberattack", "cybersecurity", "vulnerability", "exploit", "malware", "ransomware", "phishing", "ai security", "jailbreak", "prompt injection", "leaked data", "security flaw"]],
  ["hardware", ["chipmaker", "semiconductor", "tsmc", "ai chip", "gpu shortage", "wearable", "airpods", "smart glasses", "laptop", "smartphone", "neural processing", "silicon foundry", "foundry"]],
  ["policy", ["regulation", "regulator", "regulatory", "lawsuit", " sues ", " sued ", " court ", "courts ", "lawmaker", "legislation", "ban on", "white house", "congress", "senate", "eu ai act", " ftc ", "antitrust", "executive order", "copyright suit", "privacy law"]],
  ["business", [" ipo ", "raises $", "raised $", "secures $", "funding round", "series a", "series b", "series c", "venture capital", "valuation", "acquisition", "acquires", "merger", "equity stake", "stake in", "investor", "investment", "stock market", "wall street", "trillionaire", "billionaire", "share price", "s&p 500", "market cap", "earnings", "going public", " funding "]],
  ["llm", ["language model", "large language model", " llm ", " llms ", "chatbot", "reasoning model", "frontier model", "foundation model", "open-weight", "open-source model", "multimodal model", "gemma", "ai model"]],
];

// fallback: AI model category → article category slug
const MODEL_CAT_TO_ARTICLE = {
  llm: "llm",
  image: "image-gen",
  code: "coding",
  search: "ai-search",
  multimodal: "ai-ml",
  "open-source": "llm",
};
const MODEL_CATEGORY = {
  chatgpt: "llm", claude: "llm", gemini: "multimodal", grok: "llm", copilot: "llm",
  perplexity: "search", deepseek: "open-source", mistral: "open-source", "meta-ai": "open-source",
  midjourney: "image", "dall-e": "image", "stable-diffusion": "image", flux: "image",
  suno: "multimodal", runway: "multimodal", pika: "multimodal",
  cursor: "code", devin: "code", replit: "code", v0: "code", bolt: "code", lovable: "code", windsurf: "code",
  notebooklm: "multimodal",
  // Trending 2026 additions
  sora: "multimodal", veo: "multimodal", kling: "multimodal", elevenlabs: "multimodal",
  manus: "multimodal", higgsfield: "multimodal", genspark: "search", glean: "search",
  qwen: "open-source", "kimi-k2": "open-source", ideogram: "image", recraft: "image", cline: "code",
};

// Article categories considered "AI model / AI tech" — these are KEPT by the
// scope filter. The site is scoped to model + AI-tech news, so anything else is
// dropped at crawl time unless the article is tagged with a specific model.
const TECH_CATEGORIES = new Set([
  "llm", "image-gen", "video-gen", "music-audio", "coding", "ai-search",
  "ai-agent", "subtitle-translation", "design-ui", "writing", "productivity",
  "3d-spatial", "education",
]);
// Industry / peripheral topics (funding, data centers, regulation, chips,
// security). Classified ONLY so the scope filter can exclude them — they have no
// sidebar category and never reach the DB unless the article is model-tagged.
const INDUSTRY_CATEGORIES = new Set([
  "business", "infrastructure", "policy", "hardware", "security",
]);

// ── Text helpers ───────────────────────────────────────────────────────────
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#8230;/g, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}
function stripHtml(html) {
  return decodeEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(p|div|br|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function toParagraphs(html, maxLen = 1600) {
  const text = stripHtml(html);
  const paras = text.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
  let out = "";
  for (const p of paras) {
    if (out.length + p.length > maxLen && out.length > 0) break;
    out += (out ? "\n\n" : "") + p;
  }
  return out;
}
function truncate(s, n) {
  s = (s || "").trim();
  return s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, "") + "…";
}
function firstImage(html) {
  const m = String(html || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
// Model attribution favors PRECISION: a model is attributed only when the
// article is actually about it, not when it's mentioned in passing as a tool.
//   1) title match           → definitely the subject
//   2) body mentions it >= 2x → the article centers on it (title may omit it)
//   3) a single body mention  → ignored (passing reference)
// LIMITATION: keyword rules can't separate a passing tool mention from the
// subject when an industry story is misclassified into a tech category, so a few
// business articles still leak through the scope filter. Planned follow-up: an
// LLM (Claude Haiku) classification pass for semantic accuracy.
const BODY_MENTION_THRESHOLD = 2;

function classify(title, body) {
  const t = " " + title.toLowerCase() + " ";
  const full = " " + (title + " " + body).toLowerCase() + " ";

  let model = null;
  let titleMatched = false;
  for (const [slug, kws] of MODEL_RULES) {
    if (kws.some((k) => t.includes(k))) { model = slug; titleMatched = true; break; }
  }
  if (!model) {
    // No title hit — attribute the most-mentioned model that clears the
    // threshold, so a body that centers on one model still gets tagged.
    let best = null, bestCount = 0;
    for (const [slug, kws] of MODEL_RULES) {
      let count = 0;
      for (const k of kws) count += full.split(k).length - 1;
      if (count >= BODY_MENTION_THRESHOLD && count > bestCount) {
        best = slug;
        bestCount = count;
      }
    }
    model = best;
  }

  let category = null;
  for (const [slug, kws] of CATEGORY_RULES) {
    if (kws.some((k) => full.includes(k))) { category = slug; break; }
  }

  // A body-only model hit inside an industry story is a passing mention of a
  // vendor/tool, not the subject (e.g. "Railway raises $100M ... AI-native"
  // repeating "Claude", or an Elon Musk markets story repeating "Grok").
  // Drop the attribution so it's treated as the industry news it actually is.
  if (model && !titleMatched && INDUSTRY_CATEGORIES.has(category)) {
    model = null;
  }
  // A genuine model article belongs in a tech category, never an industry/empty one.
  if (model && (!category || INDUSTRY_CATEGORIES.has(category))) {
    category = MODEL_CAT_TO_ARTICLE[MODEL_CATEGORY[model]] || "llm";
  }
  if (!category) category = "ai-ml";
  return { model, category };
}
function tagsFrom(text, model, category) {
  const tags = new Set();
  if (model) tags.add(model);
  tags.add(category);
  const t = text.toLowerCase();
  for (const kw of ["open source", "funding", "regulation", "benchmark", "release", "launch", "research", "enterprise"]) {
    if (t.includes(kw)) tags.add(kw.replace(/\s+/g, "-"));
  }
  return [...tags].slice(0, 5);
}

// ── Crawl ──────────────────────────────────────────────────────────────────
const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; CurrentBot/1.0)" },
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

function pickImage(item) {
  if (item.enclosure?.url && /^https?:/.test(item.enclosure.url)) return item.enclosure.url;
  if (Array.isArray(item.mediaContent)) {
    const m = item.mediaContent.find((x) => x?.$?.url);
    if (m) return m.$.url;
  }
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  return firstImage(item.contentEncoded || item.content) || null;
}

async function crawl() {
  const seen = new Set();
  const rows = [];
  let dropped = 0;
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      let n = 0;
      for (const item of parsed.items || []) {
        if (n >= PER_FEED || rows.length >= TOTAL_CAP) break;
        const link = (item.link || "").trim();
        const title = (item.title || "").trim();
        if (!link || !title || seen.has(link)) continue;
        seen.add(link);

        const html = item.contentEncoded || item.content || item.summary || "";
        const snippet = item.contentSnippet || stripHtml(html);
        const summary = truncate(snippet, 260) || truncate(title, 260);
        let content = toParagraphs(html, 1600);
        if (content.length < 80) content = snippet || summary;
        const blob = `${title} ${snippet}`;
        const { model, category } = classify(title, `${snippet} ${content}`);

        // Scope filter: keep only model-tagged OR AI-tech articles. Industry /
        // peripheral news (funding, policy, data centers, hardware, security)
        // and uncategorized general news are excluded from the site.
        if (!model && !TECH_CATEGORIES.has(category)) {
          dropped++;
          continue;
        }
        const words = content.split(/\s+/).length;

        rows.push({
          title: truncate(title, 280),
          summary,
          content,
          source_url: link,
          source_name: feed.source,
          image_url: pickImage(item),
          category_slug: category,
          ai_model_slug: model,
          read_time: Math.max(1, Math.ceil(words / 200)),
          tags: tagsFrom(blob, model, category),
          is_trending: false,
          published_at: item.isoDate || item.pubDate || null,
        });
        n++;
      }
      console.log(`  ✓ ${feed.source}: ${n} items`);
    } catch (e) {
      console.log(`  ✗ ${feed.source}: ${e.message}`);
    }
  }
  if (dropped > 0) console.log(`  (excluded ${dropped} off-topic / industry items)`);
  return rows;
}

// ── Upsert into Supabase via REST ──────────────────────────────────────────
async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  return res;
}

async function upsert(rows) {
  // Resolve slug → uuid maps (public read)
  const [catRes, modRes] = await Promise.all([
    sb("categories?select=id,slug"),
    sb("ai_models?select=id,slug"),
  ]);
  const cats = Object.fromEntries((await catRes.json()).map((c) => [c.slug, c.id]));
  const mods = Object.fromEntries((await modRes.json()).map((m) => [m.slug, m.id]));

  const payload = rows.map((r) => {
    if (r.ai_model_slug && !mods[r.ai_model_slug]) {
      console.warn(
        `  ⚠ classified model '${r.ai_model_slug}' has no ai_models row — attribution dropped`,
      );
    }
    return {
    title: r.title,
    summary: r.summary,
    content: r.content,
    source_url: r.source_url,
    source_name: r.source_name,
    image_url: r.image_url,
    category_id: cats[r.category_slug] || cats["ai-ml"] || null,
    ai_model_id: r.ai_model_slug ? mods[r.ai_model_slug] || null : null,
    read_time: r.read_time,
    view_count: r.view_count,
    is_trending: r.is_trending,
    tags: r.tags,
    published_at: r.published_at,
    };
  });

  // Upsert in one call; ignore rows whose source_url already exists.
  const res = await sb("articles?on_conflict=source_url", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Insert failed ${res.status}: ${await res.text()}`);
  }
  const inserted = await res.json();
  return inserted.length;
}

// ── Main ───────────────────────────────────────────────────────────────────
console.log(`Crawling ${FEEDS.length} feeds…`);
const rows = await crawl();

// Sort newest-first, then assign synthetic engagement metrics so the Trending
// page and view counts feel alive (real metrics would come from analytics).
rows.sort(
  (a, b) =>
    new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime(),
);
const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
rows.forEach((r, i) => {
  const recency = Math.max(0, 1 - i / Math.max(1, rows.length)); // newest → ~1
  const noise = (hash(r.source_url) % 1000) / 1000;
  r.view_count = Math.round(800 + recency * 18000 + noise * 9000);
});
// Mark the ~12 highest-viewed as trending.
[...rows]
  .sort((a, b) => b.view_count - a.view_count)
  .slice(0, 12)
  .forEach((r) => {
    r.is_trending = true;
  });

writeFileSync(resolve(ROOT, "scripts/crawled-articles.json"), JSON.stringify(rows, null, 2));
console.log(`\nCrawled ${rows.length} articles → scripts/crawled-articles.json`);

const withModel = rows.filter((r) => r.ai_model_slug).length;
const withImage = rows.filter((r) => r.image_url).length;
const byCat = {};
for (const r of rows) byCat[r.category_slug] = (byCat[r.category_slug] || 0) + 1;
console.log(`  with model: ${withModel}/${rows.length}, with image: ${withImage}/${rows.length}`);
console.log(`  by category:`, JSON.stringify(byCat));

if (DRY) {
  console.log("\n--dry: skipped DB write.");
} else if (!SUPABASE_URL || !KEY) {
  console.log("\n⚠ Missing SUPABASE_URL / key — skipped DB write.");
} else if (!SERVICE_KEY && !ALLOW_ANON) {
  console.log(
    "\n⚠ No SUPABASE_SERVICE_ROLE_KEY found. Refusing to write articles with the public anon key.",
  );
  console.log(
    "  → Set SUPABASE_SERVICE_ROLE_KEY (recommended), or re-run with --allow-anon-insert",
  );
  console.log(
    "    (which requires a temporary anon INSERT policy on `articles`).",
  );
  process.exitCode = 1;
} else {
  console.log(`\nUpserting via ${SERVICE_KEY ? "service-role" : "anon"} key…`);
  try {
    const n = await upsert(rows);
    console.log(`✓ Inserted ${n} new articles (duplicates on source_url ignored).`);
  } catch (e) {
    console.log(`✗ ${e.message}`);
    process.exitCode = 1;
  }
}
