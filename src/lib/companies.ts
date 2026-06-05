// Company master list — roughly the largest US-listed companies by market cap,
// plus AI-native firms and global tech names that show up often in AI news.
// Used to (1) download brand logos and (2) match articles to a company.
//
// `domain`  — used by scripts/fetch-company-logos.mjs to fetch the logo.
// `aliases` — substrings searched in article title/source/summary (word-boundary,
//             case-aware match in src/lib/company-match.ts). Keep these specific:
//             avoid generic words that would cause false positives.

export interface Company {
  slug: string;
  name: string;
  domain: string;
  aliases: string[];
}

export const COMPANIES: Company[] = [
  // ── Mega-cap tech ──
  { slug: "apple", name: "Apple", domain: "apple.com", aliases: ["Apple", "iPhone", "iPad", "macOS", "Apple Intelligence"] },
  { slug: "microsoft", name: "Microsoft", domain: "microsoft.com", aliases: ["Microsoft", "MSFT", "Azure", "Windows", "Xbox"] },
  { slug: "nvidia", name: "Nvidia", domain: "nvidia.com", aliases: ["Nvidia", "NVIDIA", "GeForce", "CUDA"] },
  { slug: "alphabet", name: "Alphabet (Google)", domain: "google.com", aliases: ["Google", "Alphabet", "DeepMind", "Waymo", "YouTube", "Android"] },
  { slug: "amazon", name: "Amazon", domain: "amazon.com", aliases: ["Amazon", "AWS", "Amazon Web Services", "Alexa"] },
  { slug: "meta", name: "Meta", domain: "meta.com", aliases: ["Meta", "Facebook", "Instagram", "WhatsApp", "Llama", "Oculus"] },
  { slug: "broadcom", name: "Broadcom", domain: "broadcom.com", aliases: ["Broadcom", "VMware"] },
  { slug: "tesla", name: "Tesla", domain: "tesla.com", aliases: ["Tesla", "Cybertruck"] },
  { slug: "berkshire-hathaway", name: "Berkshire Hathaway", domain: "berkshirehathaway.com", aliases: ["Berkshire Hathaway", "Berkshire"] },

  // ── Semiconductors & hardware ──
  { slug: "amd", name: "AMD", domain: "amd.com", aliases: ["AMD", "Ryzen", "Radeon", "Advanced Micro Devices"] },
  { slug: "intel", name: "Intel", domain: "intel.com", aliases: ["Intel", "Core Ultra", "Xeon"] },
  { slug: "qualcomm", name: "Qualcomm", domain: "qualcomm.com", aliases: ["Qualcomm", "Snapdragon"] },
  { slug: "texas-instruments", name: "Texas Instruments", domain: "ti.com", aliases: ["Texas Instruments"] },
  { slug: "micron", name: "Micron", domain: "micron.com", aliases: ["Micron"] },
  { slug: "applied-materials", name: "Applied Materials", domain: "appliedmaterials.com", aliases: ["Applied Materials"] },
  { slug: "lam-research", name: "Lam Research", domain: "lamresearch.com", aliases: ["Lam Research"] },
  { slug: "analog-devices", name: "Analog Devices", domain: "analog.com", aliases: ["Analog Devices"] },
  { slug: "arm", name: "Arm", domain: "arm.com", aliases: ["Arm Holdings", "ARM Holdings"] },
  { slug: "marvell", name: "Marvell", domain: "marvell.com", aliases: ["Marvell"] },
  { slug: "kla", name: "KLA", domain: "kla.com", aliases: ["KLA Corporation"] },
  { slug: "sandisk", name: "SanDisk", domain: "sandisk.com", aliases: ["SanDisk"] },

  // ── Software & SaaS ──
  { slug: "oracle", name: "Oracle", domain: "oracle.com", aliases: ["Oracle"] },
  { slug: "salesforce", name: "Salesforce", domain: "salesforce.com", aliases: ["Salesforce", "Slack"] },
  { slug: "sap", name: "SAP", domain: "sap.com", aliases: ["SAP SE"] },
  { slug: "adobe", name: "Adobe", domain: "adobe.com", aliases: ["Adobe", "Photoshop", "Firefly"] },
  { slug: "servicenow", name: "ServiceNow", domain: "servicenow.com", aliases: ["ServiceNow"] },
  { slug: "intuit", name: "Intuit", domain: "intuit.com", aliases: ["Intuit", "QuickBooks", "TurboTax"] },
  { slug: "ibm", name: "IBM", domain: "ibm.com", aliases: ["IBM", "watsonx", "Red Hat"] },
  { slug: "snowflake", name: "Snowflake", domain: "snowflake.com", aliases: ["Snowflake"] },
  { slug: "palantir", name: "Palantir", domain: "palantir.com", aliases: ["Palantir"] },
  { slug: "crowdstrike", name: "CrowdStrike", domain: "crowdstrike.com", aliases: ["CrowdStrike"] },
  { slug: "palo-alto-networks", name: "Palo Alto Networks", domain: "paloaltonetworks.com", aliases: ["Palo Alto Networks"] },
  { slug: "fortinet", name: "Fortinet", domain: "fortinet.com", aliases: ["Fortinet"] },
  { slug: "workday", name: "Workday", domain: "workday.com", aliases: ["Workday"] },
  { slug: "atlassian", name: "Atlassian", domain: "atlassian.com", aliases: ["Atlassian", "Jira", "Confluence", "Trello"] },
  { slug: "datadog", name: "Datadog", domain: "datadoghq.com", aliases: ["Datadog"] },
  { slug: "cloudflare", name: "Cloudflare", domain: "cloudflare.com", aliases: ["Cloudflare"] },
  { slug: "mongodb", name: "MongoDB", domain: "mongodb.com", aliases: ["MongoDB"] },
  { slug: "zoom", name: "Zoom", domain: "zoom.us", aliases: ["Zoom Video"] },
  { slug: "twilio", name: "Twilio", domain: "twilio.com", aliases: ["Twilio"] },
  { slug: "hubspot", name: "HubSpot", domain: "hubspot.com", aliases: ["HubSpot"] },
  { slug: "shopify", name: "Shopify", domain: "shopify.com", aliases: ["Shopify"] },
  { slug: "dropbox", name: "Dropbox", domain: "dropbox.com", aliases: ["Dropbox"] },
  { slug: "docusign", name: "DocuSign", domain: "docusign.com", aliases: ["DocuSign"] },
  { slug: "okta", name: "Okta", domain: "okta.com", aliases: ["Okta"] },
  { slug: "zscaler", name: "Zscaler", domain: "zscaler.com", aliases: ["Zscaler"] },

  // ── Internet, media & consumer tech ──
  { slug: "netflix", name: "Netflix", domain: "netflix.com", aliases: ["Netflix"] },
  { slug: "uber", name: "Uber", domain: "uber.com", aliases: ["Uber"] },
  { slug: "airbnb", name: "Airbnb", domain: "airbnb.com", aliases: ["Airbnb"] },
  { slug: "spotify", name: "Spotify", domain: "spotify.com", aliases: ["Spotify"] },
  { slug: "paypal", name: "PayPal", domain: "paypal.com", aliases: ["PayPal"] },
  { slug: "block", name: "Block", domain: "block.xyz", aliases: ["Block Inc", "Square Inc"] },
  { slug: "coinbase", name: "Coinbase", domain: "coinbase.com", aliases: ["Coinbase"] },
  { slug: "robinhood", name: "Robinhood", domain: "robinhood.com", aliases: ["Robinhood"] },
  { slug: "doordash", name: "DoorDash", domain: "doordash.com", aliases: ["DoorDash"] },
  { slug: "pinterest", name: "Pinterest", domain: "pinterest.com", aliases: ["Pinterest"] },
  { slug: "snap", name: "Snap", domain: "snap.com", aliases: ["Snap Inc", "Snapchat"] },
  { slug: "reddit", name: "Reddit", domain: "reddit.com", aliases: ["Reddit"] },
  { slug: "roblox", name: "Roblox", domain: "roblox.com", aliases: ["Roblox"] },
  { slug: "ebay", name: "eBay", domain: "ebay.com", aliases: ["eBay"] },
  { slug: "booking", name: "Booking Holdings", domain: "booking.com", aliases: ["Booking Holdings", "Booking.com"] },

  // ── Financials ──
  { slug: "jpmorgan-chase", name: "JPMorgan Chase", domain: "jpmorganchase.com", aliases: ["JPMorgan", "JP Morgan", "Chase"] },
  { slug: "visa", name: "Visa", domain: "visa.com", aliases: ["Visa Inc"] },
  { slug: "mastercard", name: "Mastercard", domain: "mastercard.com", aliases: ["Mastercard"] },
  { slug: "bank-of-america", name: "Bank of America", domain: "bankofamerica.com", aliases: ["Bank of America"] },
  { slug: "wells-fargo", name: "Wells Fargo", domain: "wellsfargo.com", aliases: ["Wells Fargo"] },
  { slug: "goldman-sachs", name: "Goldman Sachs", domain: "goldmansachs.com", aliases: ["Goldman Sachs"] },
  { slug: "morgan-stanley", name: "Morgan Stanley", domain: "morganstanley.com", aliases: ["Morgan Stanley"] },
  { slug: "american-express", name: "American Express", domain: "americanexpress.com", aliases: ["American Express", "Amex"] },
  { slug: "citigroup", name: "Citigroup", domain: "citigroup.com", aliases: ["Citigroup", "Citibank"] },
  { slug: "blackrock", name: "BlackRock", domain: "blackrock.com", aliases: ["BlackRock"] },
  { slug: "charles-schwab", name: "Charles Schwab", domain: "schwab.com", aliases: ["Charles Schwab"] },
  { slug: "fidelity", name: "Fidelity", domain: "fidelity.com", aliases: ["Fidelity Investments"] },
  { slug: "capital-one", name: "Capital One", domain: "capitalone.com", aliases: ["Capital One"] },
  { slug: "stripe", name: "Stripe", domain: "stripe.com", aliases: ["Stripe Inc"] },

  // ── Healthcare & pharma ──
  { slug: "eli-lilly", name: "Eli Lilly", domain: "lilly.com", aliases: ["Eli Lilly"] },
  { slug: "unitedhealth", name: "UnitedHealth Group", domain: "unitedhealthgroup.com", aliases: ["UnitedHealth"] },
  { slug: "johnson-and-johnson", name: "Johnson & Johnson", domain: "jnj.com", aliases: ["Johnson & Johnson"] },
  { slug: "abbvie", name: "AbbVie", domain: "abbvie.com", aliases: ["AbbVie"] },
  { slug: "merck", name: "Merck", domain: "merck.com", aliases: ["Merck"] },
  { slug: "pfizer", name: "Pfizer", domain: "pfizer.com", aliases: ["Pfizer"] },
  { slug: "thermo-fisher", name: "Thermo Fisher Scientific", domain: "thermofisher.com", aliases: ["Thermo Fisher"] },
  { slug: "abbott", name: "Abbott", domain: "abbott.com", aliases: ["Abbott Laboratories"] },
  { slug: "amgen", name: "Amgen", domain: "amgen.com", aliases: ["Amgen"] },
  { slug: "danaher", name: "Danaher", domain: "danaher.com", aliases: ["Danaher"] },
  { slug: "bristol-myers-squibb", name: "Bristol Myers Squibb", domain: "bms.com", aliases: ["Bristol Myers Squibb", "Bristol-Myers"] },
  { slug: "medtronic", name: "Medtronic", domain: "medtronic.com", aliases: ["Medtronic"] },
  { slug: "cvs-health", name: "CVS Health", domain: "cvshealth.com", aliases: ["CVS Health", "CVS"] },
  { slug: "intuitive-surgical", name: "Intuitive Surgical", domain: "intuitive.com", aliases: ["Intuitive Surgical"] },
  { slug: "moderna", name: "Moderna", domain: "modernatx.com", aliases: ["Moderna"] },

  // ── Consumer & retail ──
  { slug: "walmart", name: "Walmart", domain: "walmart.com", aliases: ["Walmart"] },
  { slug: "costco", name: "Costco", domain: "costco.com", aliases: ["Costco"] },
  { slug: "procter-and-gamble", name: "Procter & Gamble", domain: "pg.com", aliases: ["Procter & Gamble"] },
  { slug: "coca-cola", name: "Coca-Cola", domain: "coca-cola.com", aliases: ["Coca-Cola", "Coca Cola"] },
  { slug: "pepsico", name: "PepsiCo", domain: "pepsico.com", aliases: ["PepsiCo", "Pepsi"] },
  { slug: "home-depot", name: "Home Depot", domain: "homedepot.com", aliases: ["Home Depot"] },
  { slug: "mcdonalds", name: "McDonald's", domain: "mcdonalds.com", aliases: ["McDonald's", "McDonalds"] },
  { slug: "nike", name: "Nike", domain: "nike.com", aliases: ["Nike Inc"] },
  { slug: "starbucks", name: "Starbucks", domain: "starbucks.com", aliases: ["Starbucks"] },
  { slug: "target", name: "Target", domain: "target.com", aliases: ["Target Corporation"] },
  { slug: "lowes", name: "Lowe's", domain: "lowes.com", aliases: ["Lowe's"] },
  { slug: "estee-lauder", name: "Estée Lauder", domain: "elcompanies.com", aliases: ["Estée Lauder", "Estee Lauder"] },
  { slug: "colgate", name: "Colgate-Palmolive", domain: "colgatepalmolive.com", aliases: ["Colgate-Palmolive"] },
  { slug: "mondelez", name: "Mondelez", domain: "mondelezinternational.com", aliases: ["Mondelez"] },

  // ── Industrial, auto & energy ──
  { slug: "exxonmobil", name: "ExxonMobil", domain: "exxonmobil.com", aliases: ["ExxonMobil", "Exxon Mobil"] },
  { slug: "chevron", name: "Chevron", domain: "chevron.com", aliases: ["Chevron"] },
  { slug: "ge-aerospace", name: "GE Aerospace", domain: "geaerospace.com", aliases: ["GE Aerospace", "General Electric"] },
  { slug: "caterpillar", name: "Caterpillar", domain: "caterpillar.com", aliases: ["Caterpillar"] },
  { slug: "boeing", name: "Boeing", domain: "boeing.com", aliases: ["Boeing"] },
  { slug: "honeywell", name: "Honeywell", domain: "honeywell.com", aliases: ["Honeywell"] },
  { slug: "rtx", name: "RTX", domain: "rtx.com", aliases: ["RTX Corporation", "Raytheon"] },
  { slug: "lockheed-martin", name: "Lockheed Martin", domain: "lockheedmartin.com", aliases: ["Lockheed Martin"] },
  { slug: "ge-vernova", name: "GE Vernova", domain: "gevernova.com", aliases: ["GE Vernova"] },
  { slug: "deere", name: "John Deere", domain: "deere.com", aliases: ["John Deere", "Deere & Company"] },
  { slug: "general-motors", name: "General Motors", domain: "gm.com", aliases: ["General Motors", "Cruise automation"] },
  { slug: "ford", name: "Ford", domain: "ford.com", aliases: ["Ford Motor"] },
  { slug: "3m", name: "3M", domain: "3m.com", aliases: ["3M Company"] },
  { slug: "ups", name: "UPS", domain: "ups.com", aliases: ["United Parcel Service"] },
  { slug: "fedex", name: "FedEx", domain: "fedex.com", aliases: ["FedEx"] },
  { slug: "nextera-energy", name: "NextEra Energy", domain: "nexteraenergy.com", aliases: ["NextEra Energy"] },

  // ── Telecom & entertainment ──
  { slug: "comcast", name: "Comcast", domain: "comcast.com", aliases: ["Comcast", "NBCUniversal"] },
  { slug: "verizon", name: "Verizon", domain: "verizon.com", aliases: ["Verizon"] },
  { slug: "att", name: "AT&T", domain: "att.com", aliases: ["AT&T"] },
  { slug: "t-mobile", name: "T-Mobile", domain: "t-mobile.com", aliases: ["T-Mobile"] },
  { slug: "disney", name: "Disney", domain: "disney.com", aliases: ["Walt Disney", "Disney+"] },
  { slug: "warner-bros-discovery", name: "Warner Bros. Discovery", domain: "wbd.com", aliases: ["Warner Bros", "Warner Bros. Discovery"] },

  // ── AI-native labs & startups ──
  { slug: "openai", name: "OpenAI", domain: "openai.com", aliases: ["OpenAI", "ChatGPT", "GPT-4", "GPT-5", "Sora", "DALL-E"] },
  { slug: "anthropic", name: "Anthropic", domain: "anthropic.com", aliases: ["Anthropic", "Claude"] },
  { slug: "xai", name: "xAI", domain: "x.ai", aliases: ["xAI", "Grok"] },
  { slug: "mistral-ai", name: "Mistral AI", domain: "mistral.ai", aliases: ["Mistral AI", "Mistral"] },
  { slug: "perplexity", name: "Perplexity", domain: "perplexity.ai", aliases: ["Perplexity"] },
  { slug: "hugging-face", name: "Hugging Face", domain: "huggingface.co", aliases: ["Hugging Face", "HuggingFace"] },
  { slug: "cohere", name: "Cohere", domain: "cohere.com", aliases: ["Cohere"] },
  { slug: "scale-ai", name: "Scale AI", domain: "scale.com", aliases: ["Scale AI"] },
  { slug: "databricks", name: "Databricks", domain: "databricks.com", aliases: ["Databricks", "MosaicML"] },
  { slug: "stability-ai", name: "Stability AI", domain: "stability.ai", aliases: ["Stability AI", "Stable Diffusion"] },
  { slug: "runway", name: "Runway", domain: "runwayml.com", aliases: ["Runway ML", "RunwayML"] },
  { slug: "midjourney", name: "Midjourney", domain: "midjourney.com", aliases: ["Midjourney"] },
  { slug: "elevenlabs", name: "ElevenLabs", domain: "elevenlabs.io", aliases: ["ElevenLabs", "Eleven Labs"] },
  { slug: "sierra", name: "Sierra", domain: "sierra.ai", aliases: ["Sierra AI"] },
  { slug: "glean", name: "Glean", domain: "glean.com", aliases: ["Glean AI"] },
  { slug: "harvey", name: "Harvey", domain: "harvey.ai", aliases: ["Harvey AI"] },
  { slug: "suno", name: "Suno", domain: "suno.com", aliases: ["Suno AI"] },
  { slug: "together-ai", name: "Together AI", domain: "together.ai", aliases: ["Together AI"] },
  { slug: "groq", name: "Groq", domain: "groq.com", aliases: ["Groq"] },
  { slug: "cerebras", name: "Cerebras", domain: "cerebras.net", aliases: ["Cerebras"] },
  { slug: "lambda", name: "Lambda", domain: "lambdalabs.com", aliases: ["Lambda Labs"] },
  { slug: "coreweave", name: "CoreWeave", domain: "coreweave.com", aliases: ["CoreWeave"] },
  { slug: "figure", name: "Figure", domain: "figure.ai", aliases: ["Figure AI"] },
  { slug: "cursor", name: "Cursor", domain: "cursor.com", aliases: ["Cursor AI", "Anysphere"] },
  { slug: "replit", name: "Replit", domain: "replit.com", aliases: ["Replit"] },
  { slug: "vercel", name: "Vercel", domain: "vercel.com", aliases: ["Vercel"] },
  { slug: "github", name: "GitHub", domain: "github.com", aliases: ["GitHub", "Copilot"] },

  // ── Productivity & design tools ──
  { slug: "figma", name: "Figma", domain: "figma.com", aliases: ["Figma"] },
  { slug: "notion", name: "Notion", domain: "notion.so", aliases: ["Notion"] },
  { slug: "canva", name: "Canva", domain: "canva.com", aliases: ["Canva"] },
  { slug: "asana", name: "Asana", domain: "asana.com", aliases: ["Asana"] },
  { slug: "grammarly", name: "Grammarly", domain: "grammarly.com", aliases: ["Grammarly"] },
  { slug: "discord", name: "Discord", domain: "discord.com", aliases: ["Discord"] },

  // ── Global tech (non-US, frequent in AI news) ──
  { slug: "tsmc", name: "TSMC", domain: "tsmc.com", aliases: ["TSMC", "Taiwan Semiconductor"] },
  { slug: "samsung", name: "Samsung", domain: "samsung.com", aliases: ["Samsung"] },
  { slug: "asml", name: "ASML", domain: "asml.com", aliases: ["ASML"] },
  { slug: "sony", name: "Sony", domain: "sony.com", aliases: ["Sony"] },
  { slug: "alibaba", name: "Alibaba", domain: "alibaba.com", aliases: ["Alibaba", "Qwen"] },
  { slug: "tencent", name: "Tencent", domain: "tencent.com", aliases: ["Tencent", "WeChat"] },
  { slug: "baidu", name: "Baidu", domain: "baidu.com", aliases: ["Baidu", "Ernie"] },
  { slug: "bytedance", name: "ByteDance", domain: "bytedance.com", aliases: ["ByteDance", "TikTok", "Doubao"] },
  { slug: "deepseek", name: "DeepSeek", domain: "deepseek.com", aliases: ["DeepSeek"] },
  { slug: "nintendo", name: "Nintendo", domain: "nintendo.com", aliases: ["Nintendo"] },
  { slug: "siemens", name: "Siemens", domain: "siemens.com", aliases: ["Siemens"] },
  { slug: "moonshot-ai", name: "Moonshot AI", domain: "moonshot.ai", aliases: ["Moonshot AI", "Kimi"] },
];

/** Quick lookup: slug → Company */
export const COMPANY_BY_SLUG: Record<string, Company> = Object.fromEntries(
  COMPANIES.map((c) => [c.slug, c]),
);

export interface CompanyDetail {
  founded?: string;
  valuation?: string; // market cap for public co.s, last valuation for private
  hq?: string;
  about?: string;
}

// Extra detail for companies that back the AI models we feature. Values are
// approximate (valuations move fast) and meant for the model detail modal.
export const COMPANY_DETAILS: Record<string, CompanyDetail> = {
  openai: { founded: "2015", valuation: "~$300B", hq: "San Francisco, US", about: "AI research and deployment company behind ChatGPT, GPT, Sora, and DALL·E." },
  anthropic: { founded: "2021", valuation: "~$180B", hq: "San Francisco, US", about: "AI safety company building the Claude family of models." },
  alphabet: { founded: "1998", valuation: "~$2.3T", hq: "Mountain View, US", about: "Google's parent company; Google DeepMind builds Gemini and Veo." },
  xai: { founded: "2023", valuation: "~$50B", hq: "Palo Alto, US", about: "Elon Musk's AI lab building Grok, integrated with X." },
  meta: { founded: "2004", valuation: "~$1.5T", hq: "Menlo Park, US", about: "Builds the open Llama models and the Meta AI assistant." },
  microsoft: { founded: "1975", valuation: "~$3.4T", hq: "Redmond, US", about: "Builds Copilot across its products and is OpenAI's largest backer." },
  github: { founded: "2008", valuation: "Microsoft subsidiary", hq: "San Francisco, US", about: "Code hosting platform; GitHub Copilot is its AI pair programmer." },
  perplexity: { founded: "2022", valuation: "~$18B", hq: "San Francisco, US", about: "AI-powered answer engine for conversational search." },
  midjourney: { founded: "2021", valuation: "Private", hq: "San Francisco, US", about: "Independent lab behind one of the leading AI image generators." },
  "mistral-ai": { founded: "2023", valuation: "~$12B", hq: "Paris, France", about: "Builds efficient open-weight large language models." },
  "stability-ai": { founded: "2019", valuation: "Private", hq: "London, UK", about: "Creator of the Stable Diffusion open image models." },
  elevenlabs: { founded: "2022", valuation: "~$3B", hq: "New York, US", about: "AI voice generation and text-to-speech research." },
  runway: { founded: "2018", valuation: "~$3B", hq: "New York, US", about: "Generative AI for video and creative tooling." },
  alibaba: { founded: "1999", valuation: "~$220B", hq: "Hangzhou, China", about: "Builds the open Qwen model family via Alibaba Cloud." },
  "moonshot-ai": { founded: "2023", valuation: "~$3B", hq: "Beijing, China", about: "Builds the Kimi long-context assistant." },
  deepseek: { founded: "2023", valuation: "Private", hq: "Hangzhou, China", about: "Builds high-performance open large language models." },
  cohere: { founded: "2019", valuation: "~$5.5B", hq: "Toronto, Canada", about: "Enterprise-focused LLMs and retrieval systems." },
  glean: { founded: "2019", valuation: "~$7B", hq: "Palo Alto, US", about: "Enterprise AI search and work assistant." },
};

/**
 * Resolve a model's company name (e.g. "OpenAI", "Google") to its company
 * record plus extra detail. Returns null if the company isn't in our list.
 */
export function findCompany(name: string): (Company & { detail?: CompanyDetail }) | null {
  const q = name.trim().toLowerCase();
  const company = COMPANIES.find(
    (c) =>
      c.name.toLowerCase() === q ||
      c.slug === q ||
      c.aliases.some((a) => a.toLowerCase() === q),
  );
  if (!company) return null;
  return { ...company, detail: COMPANY_DETAILS[company.slug] };
}
