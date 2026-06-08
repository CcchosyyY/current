import type { AIModelSlug } from "./types";

// Long-form, model-specific content for the detail modal. Kept here (rather than
// inline in AI_MODELS) so constants.ts stays a lean registry, mirroring the
// COMPANY_DETAILS pattern in companies.ts.
//
// `overview` is rendered as paragraphs split on "\n\n". Values are written to be
// broadly accurate but intentionally evergreen — avoid version numbers that
// churn every few weeks where a general phrasing works just as well.
export interface AIModelDetail {
  overview: string;
  highlights: string[];
  bestFor: string[];
  specs?: { label: string; value: string }[];
}

// Partial: filled in phases. Models without an entry fall back to the one-line
// `description` from AI_MODELS, so the modal still renders for every model.
export const MODEL_DETAILS: Partial<Record<AIModelSlug, AIModelDetail>> = {
  chatgpt: {
    overview:
      "ChatGPT is OpenAI's flagship conversational assistant and the product that brought generative AI to the mainstream. Built on the GPT series, it handles open-ended dialogue, long-form writing, coding, data analysis, and image understanding inside a single chat interface.\n\n" +
      "Beyond plain text it can browse the web for current information, run Python in a sandboxed code interpreter, generate and edit images with DALL·E, and talk back through a natural voice mode. Custom GPTs let anyone package instructions, knowledge, and tools into a shareable mini-assistant.\n\n" +
      "It remains the default starting point for most people trying AI for the first time, with a generous free tier and paid plans that unlock the strongest reasoning models and higher usage limits.",
    highlights: [
      "Strong general reasoning across writing, coding, and analysis",
      "Built-in web browsing, Python code interpreter, and DALL·E image generation",
      "Natural voice mode and image input (vision)",
      "Custom GPTs and a tool/function-calling ecosystem",
      "Broad API access for developers",
    ],
    bestFor: ["General writing", "Coding", "Research", "Data analysis", "Brainstorming"],
    specs: [
      { label: "Type", value: "LLM · Multimodal" },
      { label: "Modality", value: "Text · Image · Voice" },
      { label: "Access", value: "Web · Mobile · API" },
      { label: "Pricing", value: "Free · Plus $20/mo" },
    ],
  },

  claude: {
    overview:
      "Claude is Anthropic's family of assistants, built with a heavy emphasis on safety, honesty, and steerability. It is widely regarded as one of the strongest models for nuanced writing, careful reasoning, and long-document work.\n\n" +
      "Claude handles very large context windows, letting you drop in entire codebases, contracts, or research papers and ask questions across all of it at once. Its tool-use and computer-use abilities make it a popular engine for coding agents and automation, and Artifacts render code, documents, and small apps side-by-side with the chat.\n\n" +
      "Developers reach Claude through the API and through Claude Code, a terminal-native coding agent, while everyday users work in the Claude.ai web and mobile apps.",
    highlights: [
      "Excellent long-form writing and careful, well-structured reasoning",
      "Very large context window for whole-codebase and document analysis",
      "Artifacts: live code, docs, and mini-apps next to the chat",
      "Strong tool use and agentic coding (Claude Code)",
      "Constitutional-AI approach focused on safety and helpfulness",
    ],
    bestFor: ["Long-form writing", "Coding agents", "Document analysis", "Reasoning"],
    specs: [
      { label: "Type", value: "LLM" },
      { label: "Modality", value: "Text · Image input" },
      { label: "Access", value: "Web · Mobile · API" },
      { label: "Pricing", value: "Free · Pro $20/mo" },
    ],
  },

  gemini: {
    overview:
      "Gemini is Google DeepMind's natively multimodal model family, designed from the ground up to reason across text, images, audio, and video rather than bolting modalities on after the fact.\n\n" +
      "Its standout trait is an enormous context window — long enough to ingest hours of video, lengthy PDFs, or large code repositories in a single prompt. Gemini is woven across Google's ecosystem: Search's AI overviews, Workspace apps like Docs and Gmail, Android, and the Pixel line, as well as Vertex AI for enterprise developers.\n\n" +
      "It ships in several sizes, from fast lightweight variants for high-volume tasks to the most capable Pro tier for hard reasoning and multimodal problems.",
    highlights: [
      "Natively multimodal: text, image, audio, and video in one model",
      "Industry-leading context window (long video and document understanding)",
      "Deeply integrated with Search, Workspace, Android, and Pixel",
      "Multiple sizes (Flash / Pro) to trade speed against capability",
      "Enterprise access via Vertex AI",
    ],
    bestFor: ["Multimodal tasks", "Long video/docs", "Google Workspace", "Research"],
    specs: [
      { label: "Type", value: "Multimodal" },
      { label: "Modality", value: "Text · Image · Audio · Video" },
      { label: "Access", value: "Web · Mobile · API · Vertex" },
      { label: "Pricing", value: "Free · AI Pro plans" },
    ],
  },

  grok: {
    overview:
      "Grok is the assistant from xAI, Elon Musk's AI company, distinguished by its tight integration with X (formerly Twitter) and a deliberately more candid, witty personality than most rivals.\n\n" +
      "Its defining edge is real-time access to the public conversation on X, which lets it answer questions about breaking news and trending topics with unusually fresh context. The lineup has expanded beyond chat into image and video generation through Grok Imagine.\n\n" +
      "Grok is available to X subscribers and through a standalone app and API, positioning itself as the AI for people who want current, unfiltered answers plugged into the live web.",
    highlights: [
      "Real-time knowledge from the live X (Twitter) firehose",
      "More candid, humorous personality by design",
      "Image and video generation via Grok Imagine",
      "Deep integration with the X platform",
      "Standalone app and API access",
    ],
    bestFor: ["Breaking news", "Real-time search", "Casual chat", "Image/video gen"],
    specs: [
      { label: "Type", value: "LLM · Multimodal" },
      { label: "Modality", value: "Text · Image · Video" },
      { label: "Access", value: "X · App · API" },
      { label: "Pricing", value: "X Premium · API" },
    ],
  },

  copilot: {
    overview:
      "Microsoft Copilot is Microsoft's AI assistant, woven across Windows, Microsoft 365 (Word, Excel, PowerPoint, Outlook, Teams), Edge, and GitHub. It is built on OpenAI's frontier models combined with Microsoft's own orchestration.\n\n" +
      "For everyday users it offers web-grounded chat, voice, and image generation through Designer. For organizations, Copilot grounds its answers in your work content via the Microsoft Graph — your documents, emails, and meetings — with enterprise data protection.\n\n" +
      "Copilot Studio lets teams build and deploy their own custom agents on top of the same platform.",
    highlights: [
      "Embedded across Windows, Microsoft 365, Edge, and Teams",
      "Grounds answers in your work via the Microsoft Graph",
      "Built on OpenAI frontier models with enterprise data protection",
      "Image generation through Designer",
      "Copilot Studio for building custom agents",
    ],
    bestFor: ["Office productivity", "Enterprise work", "Email & docs", "Meetings"],
    specs: [
      { label: "Type", value: "LLM · Assistant" },
      { label: "Modality", value: "Text · Image · Voice" },
      { label: "Access", value: "Windows · M365 · Web" },
      { label: "Pricing", value: "Free · Pro $20/mo" },
    ],
  },

  perplexity: {
    overview:
      "Perplexity is an AI answer engine: ask a question and it replies with a concise, cited summary drawn from live web sources rather than a list of blue links. Every answer footnotes where its information came from, so claims are easy to verify.\n\n" +
      "Pro Search runs multi-step research for harder questions, and you can switch the underlying frontier model (GPT, Claude, Gemini, and others). Focus modes, file uploads, and Spaces tailor it to specific tasks.\n\n" +
      "It is available on the web, mobile, and through an agentic browsing experience for people who want sourced, up-to-date answers.",
    highlights: [
      "Cited, source-grounded answers from the live web",
      "Pro Search for deeper multi-step research",
      "Choice of underlying models (GPT, Claude, Gemini)",
      "Focus modes and file upload for grounded Q&A",
      "Web, mobile, and an agentic browser",
    ],
    bestFor: ["Research", "Fact-checking", "Current events", "Citations"],
    specs: [
      { label: "Type", value: "AI answer engine" },
      { label: "Modality", value: "Text · Image input" },
      { label: "Access", value: "Web · Mobile · API" },
      { label: "Pricing", value: "Free · Pro $20/mo" },
    ],
  },

  deepseek: {
    overview:
      "DeepSeek is a Chinese AI lab known for releasing high-performance open-weight models at a fraction of the usual training cost. Its R1 reasoning model and V-series chat models rivaled far more expensive Western systems and reset industry expectations on cost efficiency.\n\n" +
      "Because the weights are openly available under a permissive license, DeepSeek can be self-hosted and fine-tuned freely. A free consumer chat app and an inexpensive API have driven very rapid adoption.",
    highlights: [
      "Open-weight models with frontier-level reasoning",
      "Dramatically low training and inference cost",
      "R1-style transparent chain-of-thought reasoning",
      "Free consumer chat app and cheap API",
      "Permissive licensing for self-hosting",
    ],
    bestFor: ["Reasoning", "Math & code", "Self-hosting", "Low-cost API"],
    specs: [
      { label: "Type", value: "LLM · Open weights" },
      { label: "Modality", value: "Text" },
      { label: "Access", value: "Web · App · API" },
      { label: "Pricing", value: "Free · low-cost API" },
    ],
  },

  mistral: {
    overview:
      "Mistral AI is a Paris-based lab and Europe's leading open-weight model maker. It ships efficient open models (Mistral and the Mixtral mixture-of-experts family) alongside commercial frontier models, with a focus on performance-per-cost and European data sovereignty.\n\n" +
      "Le Chat is its consumer assistant, while La Plateforme and the API serve developers. Strong multilingual and coding ability, plus the option to self-host, make it popular with companies that need control over where their data runs.",
    highlights: [
      "Efficient open-weight models (Mistral, Mixtral MoE)",
      "Commercial frontier models via La Plateforme",
      "Strong multilingual and coding performance",
      "EU-based with a data-sovereignty focus",
      "Le Chat assistant for end users",
    ],
    bestFor: ["Open models", "EU data residency", "Coding", "Cost efficiency"],
    specs: [
      { label: "Type", value: "LLM · Open + commercial" },
      { label: "Modality", value: "Text · Image input" },
      { label: "Access", value: "Web · API" },
      { label: "Pricing", value: "Free · API · Enterprise" },
    ],
  },

  "meta-ai": {
    overview:
      "Meta AI is Meta's assistant, powered by its open Llama models and built directly into WhatsApp, Instagram, Messenger, and Facebook, plus a standalone app and Ray-Ban Meta smart glasses.\n\n" +
      "The Llama family is among the most widely adopted open-weight models in the world, downloaded and fine-tuned by an enormous developer community. For everyday users, Meta AI offers free chat, image generation, and editing right inside the apps they already use.",
    highlights: [
      "Powered by the open Llama model family",
      "Built into WhatsApp, Instagram, Messenger, Facebook",
      "Free image generation and editing",
      "Available on Ray-Ban Meta smart glasses",
      "Llama weights widely used by developers",
    ],
    bestFor: ["Social apps", "Open models", "Image generation", "On-device AI"],
    specs: [
      { label: "Type", value: "LLM · Open weights" },
      { label: "Modality", value: "Text · Image · Voice" },
      { label: "Access", value: "Apps · Web · Glasses" },
      { label: "Pricing", value: "Free" },
    ],
  },

  midjourney: {
    overview:
      "Midjourney is an independent research lab behind one of the most acclaimed text-to-image generators, prized for its painterly, highly aesthetic output. It is a favorite of concept artists and designers for mood boards and ideation.\n\n" +
      "Originally operated through a Discord bot, it now has a full web app with an editor, style references, and personalization profiles, and has expanded into video generation.",
    highlights: [
      "Best-in-class aesthetic, artistic image quality",
      "Style references and personalization profiles",
      "Web editor with inpainting, pan, and zoom",
      "Strong community and prompt ecosystem",
      "Expanding into video generation",
    ],
    bestFor: ["Concept art", "Illustration", "Mood boards", "Marketing visuals"],
    specs: [
      { label: "Type", value: "Image generation" },
      { label: "Modality", value: "Text → Image · Video" },
      { label: "Access", value: "Web · Discord" },
      { label: "Pricing", value: "From $10/mo" },
    ],
  },

  "dall-e": {
    overview:
      "DALL·E is OpenAI's text-to-image model, available inside ChatGPT and through the API. It is known for reliably following detailed prompts and for tight ChatGPT integration, so you can iterate on images conversationally and edit specific regions.\n\n" +
      "Outputs carry C2PA content credentials. OpenAI's newer image generation is increasingly built directly into its GPT models, with DALL·E remaining a simple, accessible entry point.",
    highlights: [
      "Strong natural-language prompt adherence",
      "Built into ChatGPT for conversational editing",
      "Inpainting and region edits",
      "Available via the OpenAI API",
      "C2PA content credentials on outputs",
    ],
    bestFor: ["Quick illustrations", "ChatGPT users", "Concepting", "Edits"],
    specs: [
      { label: "Type", value: "Image generation" },
      { label: "Modality", value: "Text → Image" },
      { label: "Access", value: "ChatGPT · API" },
      { label: "Pricing", value: "ChatGPT Plus · API" },
    ],
  },

  "stable-diffusion": {
    overview:
      "Stable Diffusion is the open image-generation model from Stability AI that catalyzed the open-source generative-art movement. Because the weights are openly available, it can run entirely on your own GPU.\n\n" +
      "It powers a vast ecosystem of local tools, fine-tunes, LoRAs, and ControlNets, giving creators full control over the generation pipeline with no per-image cloud cost when self-hosted.",
    highlights: [
      "Open weights you can run locally",
      "Huge ecosystem of fine-tunes, LoRAs, ControlNet",
      "Full control over the generation pipeline",
      "No per-image cloud cost when self-hosted",
      "Commercial and research model tiers",
    ],
    bestFor: ["Local generation", "Custom fine-tunes", "Developers", "Privacy"],
    specs: [
      { label: "Type", value: "Image gen · Open weights" },
      { label: "Modality", value: "Text · Image → Image" },
      { label: "Access", value: "Local · API · Web" },
      { label: "Pricing", value: "Open · API tiers" },
    ],
  },

  flux: {
    overview:
      "FLUX is a family of image models from Black Forest Labs, founded by the original creators of Stable Diffusion. It quickly became a favorite for photorealism, prompt accuracy, and reliable in-image text rendering.\n\n" +
      "It ships in open (schnell and dev) and Pro tiers, and powers image features inside several major consumer apps.",
    highlights: [
      "State-of-the-art photorealism and prompt accuracy",
      "Reliable in-image text rendering",
      "Open (schnell / dev) and Pro variants",
      "Founded by original Stable Diffusion creators",
      "Powers image gen in major consumer apps",
    ],
    bestFor: ["Photorealism", "Text in images", "Product shots", "Developers"],
    specs: [
      { label: "Type", value: "Image gen · Open + Pro" },
      { label: "Modality", value: "Text → Image" },
      { label: "Access", value: "API · Local · Web" },
      { label: "Pricing", value: "Open · API" },
    ],
  },

  suno: {
    overview:
      "Suno is an AI music generator that turns a text prompt into a full song — vocals, lyrics, instruments, and structure — in seconds. It made original music creation accessible to anyone, for jingles, demos, and social content.\n\n" +
      "You can write your own lyrics or let it generate them, pick from many genres, and extend or remix tracks. It has been at the center of debates over AI and music licensing.",
    highlights: [
      "Full songs (vocals + instruments) from a prompt",
      "Custom or AI-written lyrics",
      "Many genres and styles",
      "Extend, remix, and stem options",
      "Web and mobile apps",
    ],
    bestFor: ["Original songs", "Jingles", "Demos", "Social content"],
    specs: [
      { label: "Type", value: "Music generation" },
      { label: "Modality", value: "Text → Audio" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Free · Pro plans" },
    ],
  },

  runway: {
    overview:
      "Runway is a generative video and creative-tooling company whose Gen-series models produce high-quality text-, image-, and video-to-video clips. Beyond generation it offers a full editing suite — motion brush, camera controls, inpainting, green screen, and more.\n\n" +
      "It is a staple in professional and indie film workflows, backed by an active research lab pushing the frontier of generative video.",
    highlights: [
      "Gen-series text / image / video-to-video models",
      "Director-style camera and motion controls",
      "Full creative suite (inpaint, green screen)",
      "Used in professional film and ad production",
      "Active research lab pushing the frontier",
    ],
    bestFor: ["Video generation", "Filmmaking", "VFX", "Ad creative"],
    specs: [
      { label: "Type", value: "Video generation" },
      { label: "Modality", value: "Text · Image → Video" },
      { label: "Access", value: "Web · API" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  pika: {
    overview:
      "Pika is a generative video platform focused on making short, fun, shareable clips easy to create. It is known for playful effects (its signature 'Pikaffects') and an approachable interface.\n\n" +
      "Rather than a full production suite, Pika targets social creators who want quick image- and text-to-video plus effects, with frequent new feature drops.",
    highlights: [
      "Fast, approachable image- and text-to-video",
      "Signature 'Pikaffects' creative effects",
      "Designed for social-media short clips",
      "Frequent feature drops",
      "Web and mobile access",
    ],
    bestFor: ["Social clips", "Quick effects", "Creators", "Memes"],
    specs: [
      { label: "Type", value: "Video generation" },
      { label: "Modality", value: "Text · Image → Video" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  cursor: {
    overview:
      "Cursor is an AI-first code editor — a fork of VS Code — built by Anysphere that has become a favorite among professional developers. It blends fast autocomplete with an in-editor chat that understands your whole codebase.\n\n" +
      "Its Agent mode can plan and apply multi-file changes, run terminal commands, and fix errors, working with frontier models like Claude and GPT while keeping the familiar VS Code foundation and extensions.",
    highlights: [
      "Codebase-aware chat and edits",
      "Predictive multi-line 'Tab' autocomplete",
      "Agent mode for multi-file changes and commands",
      "Works with frontier models (Claude, GPT)",
      "Familiar VS Code foundation and extensions",
    ],
    bestFor: ["Professional coding", "Refactors", "Whole-repo edits", "Pair programming"],
    specs: [
      { label: "Type", value: "AI code editor" },
      { label: "Modality", value: "Text · Code" },
      { label: "Access", value: "Desktop (Mac/Win/Linux)" },
      { label: "Pricing", value: "Free · Pro $20/mo" },
    ],
  },

  devin: {
    overview:
      "Devin, from Cognition, was introduced as the first autonomous AI software engineer — an agent that takes a task, plans it, and writes and runs code in its own sandboxed environment complete with a shell, editor, and browser.\n\n" +
      "It iterates and self-corrects until the work is done, and integrates with Slack and the IDE so you can assign tickets and run multiple agents in parallel.",
    highlights: [
      "Autonomous, end-to-end task execution",
      "Own sandbox with shell, editor, and browser",
      "Plans, runs, tests, and self-corrects",
      "Slack and IDE integration for assigning work",
      "Parallel agents for multiple tickets",
    ],
    bestFor: ["Autonomous tickets", "Bug fixes", "Migrations", "Backlog tasks"],
    specs: [
      { label: "Type", value: "Autonomous coding agent" },
      { label: "Modality", value: "Text · Code" },
      { label: "Access", value: "Web · Slack · IDE" },
      { label: "Pricing", value: "Subscription" },
    ],
  },

  replit: {
    overview:
      "Replit is a browser-based coding platform with zero-setup environments, hosting, and real-time collaboration. Its Agent can build and deploy full applications from a natural-language prompt.\n\n" +
      "That makes it popular both for fast prototyping and for people learning to code without configuring a local toolchain — all the way from idea to a live, hosted app.",
    highlights: [
      "Zero-setup dev environments in the browser",
      "Agent builds and deploys full apps from prompts",
      "Built-in hosting, databases, and deployment",
      "Real-time multiplayer collaboration",
      "Mobile app for coding anywhere",
    ],
    bestFor: ["Prototyping", "Learning to code", "Vibe coding", "Hosting"],
    specs: [
      { label: "Type", value: "Cloud IDE + agent" },
      { label: "Modality", value: "Text · Code" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Free · Core $20/mo" },
    ],
  },

  v0: {
    overview:
      "v0 by Vercel generates UI and full-stack code from natural-language prompts or images, producing React/Next.js components styled with Tailwind and shadcn/ui that you can refine in chat.\n\n" +
      "It is tuned for the modern web stack and outputs clean, copy-pasteable code with one-click deployment to Vercel.",
    highlights: [
      "Generates React/Next.js + Tailwind + shadcn/ui",
      "Prompt- or image-to-UI",
      "Iterative chat-based refinement",
      "One-click deploy to Vercel",
      "Outputs clean, copy-pasteable code",
    ],
    bestFor: ["UI generation", "Next.js apps", "Prototypes", "Landing pages"],
    specs: [
      { label: "Type", value: "AI app / UI builder" },
      { label: "Modality", value: "Text · Image → Code" },
      { label: "Access", value: "Web" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  bolt: {
    overview:
      "Bolt.new, by StackBlitz, is an in-browser AI full-stack builder that runs an entire dev environment in your tab using WebContainers. You describe an app and it writes, runs, and lets you edit it live.\n\n" +
      "With a real Node runtime in the browser, npm packages, and no local setup, you can go from prompt to a deployed app entirely from a single tab.",
    highlights: [
      "Full-stack apps generated and run in the browser",
      "Real Node runtime via WebContainers",
      "Live edit, preview, and error fixing",
      "Install npm packages, no local setup",
      "One-click deploy and share",
    ],
    bestFor: ["Full-stack prototypes", "Quick MVPs", "Demos", "Vibe coding"],
    specs: [
      { label: "Type", value: "In-browser app builder" },
      { label: "Modality", value: "Text → Code" },
      { label: "Access", value: "Web" },
      { label: "Pricing", value: "Free · Paid tiers" },
    ],
  },

  lovable: {
    overview:
      "Lovable is an AI app builder aimed at non-developers, turning plain-language descriptions into working full-stack web apps with a polished UI and a Supabase backend.\n\n" +
      "It emphasizes shipping real, editable products fast, with GitHub sync so developers can take over the code, plus publishing and custom domains.",
    highlights: [
      "Natural-language to full-stack web app",
      "Built-in Supabase backend and auth",
      "Polished, responsive UI out of the box",
      "GitHub sync for developer handoff",
      "Publish with custom domains",
    ],
    bestFor: ["Non-developers", "MVPs", "Startups", "Internal tools"],
    specs: [
      { label: "Type", value: "AI app builder" },
      { label: "Modality", value: "Text → Code" },
      { label: "Access", value: "Web" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  windsurf: {
    overview:
      "Windsurf is an agentic IDE from Codeium built around 'Cascade,' an agent that understands your whole codebase and can run multi-step edits, commands, and tools while staying in sync with what you are doing.\n\n" +
      "It targets a flow-state coding experience with deep context awareness and fast built-in autocomplete, in a familiar editor.",
    highlights: [
      "Cascade agent with deep codebase awareness",
      "Multi-file edits, commands, and tool use",
      "Keeps in sync with your live actions",
      "Built-in fast autocomplete",
      "Familiar editor experience",
    ],
    bestFor: ["Agentic coding", "Large codebases", "Refactors", "Flow-state dev"],
    specs: [
      { label: "Type", value: "Agentic IDE" },
      { label: "Modality", value: "Text · Code" },
      { label: "Access", value: "Desktop" },
      { label: "Pricing", value: "Free · Pro plans" },
    ],
  },

  notebooklm: {
    overview:
      "NotebookLM is Google's AI research assistant that grounds itself entirely in sources you upload — PDFs, docs, slides, web pages, and video. It answers with citations back to your material, so nothing is made up out of thin air.\n\n" +
      "It can generate summaries, study guides, FAQs, timelines, and mind maps, plus its hallmark 'Audio Overview' — a podcast-style conversation about your documents.",
    highlights: [
      "Answers grounded only in your uploaded sources",
      "Inline citations back to the source",
      "Audio Overview: podcast-style summary of your docs",
      "Study guides, FAQs, timelines, briefing docs",
      "Mind maps and shareable notebooks",
    ],
    bestFor: ["Studying", "Research", "Document Q&A", "Summarizing"],
    specs: [
      { label: "Type", value: "Research assistant" },
      { label: "Modality", value: "Text · Audio · Video in" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Free · Plus" },
    ],
  },

  sora: {
    overview:
      "Sora is OpenAI's text-to-video model that generates realistic, coherent clips — now with synchronized audio — from a prompt or image. It brought high-fidelity AI video into the mainstream.\n\n" +
      "The Sora app adds a social feed and 'cameos' that drop a person's likeness into generated scenes, and it is available to ChatGPT subscribers and via the API.",
    highlights: [
      "Realistic text- and image-to-video with audio",
      "Strong physical and temporal coherence",
      "'Cameos' to insert real likenesses",
      "Social app feed for remixing",
      "Available to ChatGPT subscribers",
    ],
    bestFor: ["Cinematic clips", "Storyboards", "Social video", "Concepting"],
    specs: [
      { label: "Type", value: "Video generation" },
      { label: "Modality", value: "Text · Image → Video+Audio" },
      { label: "Access", value: "App · Web · API" },
      { label: "Pricing", value: "ChatGPT · API" },
    ],
  },

  veo: {
    overview:
      "Veo is Google DeepMind's video generation model, producing high-resolution clips with native synchronized audio — dialogue, sound effects, and ambience generated together with the picture.\n\n" +
      "Known for strong prompt adherence and cinematic quality, it is available through the Gemini app, Google's Flow filmmaking tool, and the Gemini API / Vertex AI.",
    highlights: [
      "1080p+ video with native synchronized audio",
      "Strong prompt adherence and realism",
      "Image-to-video and reference-guided control",
      "Available in Gemini, Flow, and Vertex AI",
      "Built by Google DeepMind",
    ],
    bestFor: ["Cinematic video", "Ads", "Filmmaking", "Sound + motion"],
    specs: [
      { label: "Type", value: "Video generation" },
      { label: "Modality", value: "Text · Image → Video+Audio" },
      { label: "Access", value: "Gemini · Flow · API" },
      { label: "Pricing", value: "AI plans · API" },
    ],
  },

  kling: {
    overview:
      "Kling, made by Chinese tech company Kuaishou, is a leading text- and image-to-video model praised for cinematic realism, strong motion physics, and relatively long clip durations.\n\n" +
      "It offers fine control through start/end-frame guidance, a motion brush, and lip-sync, and has been widely adopted by creators worldwide through frequent model upgrades.",
    highlights: [
      "Cinematic realism with strong motion physics",
      "Longer clip durations than many rivals",
      "Image-to-video with start/end frame control",
      "Lip-sync and motion brush controls",
      "Frequent model upgrades",
    ],
    bestFor: ["Cinematic video", "Image animation", "Social content", "Ads"],
    specs: [
      { label: "Type", value: "Video generation" },
      { label: "Modality", value: "Text · Image → Video" },
      { label: "Access", value: "Web · App · API" },
      { label: "Pricing", value: "Free credits · Paid" },
    ],
  },

  elevenlabs: {
    overview:
      "ElevenLabs is the leading AI voice platform, producing remarkably lifelike speech with control over emotion and pacing. It offers instant and professional voice cloning, multilingual dubbing, and sound effects.\n\n" +
      "Low-latency conversational voice agents and a developer API/SDKs make it a backbone for audiobooks, games, media, and voice-enabled apps.",
    highlights: [
      "Lifelike text-to-speech with emotional control",
      "Instant and professional voice cloning",
      "Multilingual dubbing across many languages",
      "Low-latency conversational voice agents",
      "Studio, API, and SDKs for developers",
    ],
    bestFor: ["Voiceover", "Dubbing", "Audiobooks", "Voice agents"],
    specs: [
      { label: "Type", value: "Voice AI" },
      { label: "Modality", value: "Text → Speech" },
      { label: "Access", value: "Web · API" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  manus: {
    overview:
      "Manus is a general-purpose autonomous AI agent that plans and executes multi-step tasks on its own — researching, browsing the web, writing code, and producing real deliverables like reports, sites, and spreadsheets.\n\n" +
      "It runs work asynchronously in the cloud across parallel sessions, so you can hand off a task and walk away, then review a shareable replay of everything it did.",
    highlights: [
      "Autonomous multi-step task execution",
      "Browses, codes, and builds real deliverables",
      "Runs asynchronously in the cloud",
      "Parallel sessions for multiple tasks",
      "Shareable replays of its work",
    ],
    bestFor: ["Research reports", "Web tasks", "Automation", "Data work"],
    specs: [
      { label: "Type", value: "Autonomous AI agent" },
      { label: "Modality", value: "Text · Web · Code" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Credit-based plans" },
    ],
  },

  genspark: {
    overview:
      "Genspark is an all-in-one 'Super Agent' that orchestrates multiple LLMs and tools to complete tasks end to end. Instead of a list of links, it generates custom 'Sparkpage' answers, and it can run autonomous workflows.\n\n" +
      "Its agent can make calls, build slides and sheets, and chain built-in tools and integrations, positioning Genspark as a do-everything agentic workspace.",
    highlights: [
      "Orchestrates multiple models and tools",
      "Generates custom 'Sparkpage' answers",
      "Autonomous agent for calls, slides, sheets",
      "Built-in tools and integrations",
      "Web and mobile apps",
    ],
    bestFor: ["Agentic tasks", "Research", "Slides & docs", "Automation"],
    specs: [
      { label: "Type", value: "AI super agent" },
      { label: "Modality", value: "Text · Multimodal" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  qwen: {
    overview:
      "Qwen is Alibaba's family of open-weight models spanning language, vision, coding, and audio, with strong multilingual and reasoning performance. Its openly licensed weights are among the most downloaded and fine-tuned in the world.\n\n" +
      "A free Qwen Chat assistant and the Alibaba Cloud API serve users and developers, while the open weights let teams self-host and customize freely.",
    highlights: [
      "Broad open-weight family (LLM, vision, coder, audio)",
      "Strong multilingual and reasoning ability",
      "Among the most adopted open models globally",
      "Permissive licensing for self-hosting",
      "Free Qwen Chat and cloud API",
    ],
    bestFor: ["Open models", "Multilingual", "Coding", "Self-hosting"],
    specs: [
      { label: "Type", value: "LLM · Open weights" },
      { label: "Modality", value: "Text · Image · Audio" },
      { label: "Access", value: "Web · API · Local" },
      { label: "Pricing", value: "Open · API" },
    ],
  },

  "kimi-k2": {
    overview:
      "Kimi K2, from Chinese lab Moonshot AI, is an open-weight trillion-parameter mixture-of-experts model built especially for agentic and coding tasks. It pairs strong tool-use with long-context understanding.\n\n" +
      "Competitive with frontier models on coding and agent benchmarks, it is offered through the free Kimi assistant and a low-cost API, with open weights for self-hosting.",
    highlights: [
      "Open-weight trillion-parameter MoE model",
      "Tuned for agentic tool use and coding",
      "Long-context understanding",
      "Competitive with frontier models on benchmarks",
      "Free assistant and low-cost API",
    ],
    bestFor: ["Agentic coding", "Tool use", "Long context", "Self-hosting"],
    specs: [
      { label: "Type", value: "LLM · Open weights (MoE)" },
      { label: "Modality", value: "Text" },
      { label: "Access", value: "Web · App · API" },
      { label: "Pricing", value: "Open · low-cost API" },
    ],
  },

  ideogram: {
    overview:
      "Ideogram is a text-to-image generator renowned for rendering accurate, legible text inside images — making it a go-to for posters, logos, and typographic designs where most models struggle.\n\n" +
      "It also offers strong photorealism, a Magic Prompt enhancer, and editing tools like a canvas, inpainting, and upscaling, across web and mobile.",
    highlights: [
      "Best-in-class in-image text and typography",
      "Strong photorealistic and graphic styles",
      "Magic Prompt for prompt enhancement",
      "Canvas, inpainting, and upscaling tools",
      "Web and mobile apps",
    ],
    bestFor: ["Posters & logos", "Text in images", "Marketing", "Graphic design"],
    specs: [
      { label: "Type", value: "Image generation" },
      { label: "Modality", value: "Text → Image" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  recraft: {
    overview:
      "Recraft is an AI design tool aimed at professional designers, generating not just raster images but production-ready vector SVGs, icons, and mockups with consistent brand styles.\n\n" +
      "Custom style training, an infinite canvas, and an API make it suited to real design workflows rather than one-off images.",
    highlights: [
      "Generates editable vector (SVG) graphics",
      "Custom, reusable brand styles",
      "Icon sets, mockups, and illustrations",
      "Infinite canvas workflow",
      "API for design automation",
    ],
    bestFor: ["Vector / SVG design", "Brand assets", "Icons", "Designers"],
    specs: [
      { label: "Type", value: "AI design tool" },
      { label: "Modality", value: "Text → Image / SVG" },
      { label: "Access", value: "Web · API" },
      { label: "Pricing", value: "Free · Paid plans" },
    ],
  },

  glean: {
    overview:
      "Glean is an enterprise 'Work AI' platform that connects to a company's apps — Slack, Google, Jira, Confluence, and many more — to provide permissions-aware search and AI assistants grounded in internal knowledge.\n\n" +
      "It builds a company knowledge graph so answers respect each user's access rights, and teams can build custom agents and workflows on top, with enterprise-grade security and governance.",
    highlights: [
      "Permissions-aware search across company apps",
      "Assistants grounded in internal knowledge",
      "Company knowledge graph for relevance",
      "Build custom agents and workflows",
      "Enterprise-grade security and governance",
    ],
    bestFor: ["Enterprise search", "Internal Q&A", "Knowledge work", "Agents"],
    specs: [
      { label: "Type", value: "Enterprise Work AI" },
      { label: "Modality", value: "Text" },
      { label: "Access", value: "Web · App · API" },
      { label: "Pricing", value: "Enterprise" },
    ],
  },

  cline: {
    overview:
      "Cline is an open-source autonomous coding agent that lives in your IDE (and terminal or CI), able to read and edit files, run commands, and use the browser — with your approval at each step.\n\n" +
      "Being open and model-agnostic, you bring your own API key and keep full transparency over what it does, and you can extend it with custom tools via MCP.",
    highlights: [
      "Open-source, fully transparent agent",
      "Plan / Act modes with step-by-step approval",
      "Edits files, runs commands, uses the browser",
      "Model-agnostic (bring your own key)",
      "MCP support for custom tools",
    ],
    bestFor: ["Agentic coding", "Open-source fans", "Transparency", "Custom tools"],
    specs: [
      { label: "Type", value: "Open coding agent" },
      { label: "Modality", value: "Text · Code" },
      { label: "Access", value: "IDE · CLI" },
      { label: "Pricing", value: "Open · BYO API key" },
    ],
  },

  higgsfield: {
    overview:
      "Higgsfield is a generative AI studio focused on cinematic, motion-rich short video for social media. Its hallmark is camera-control presets and an 'AI Director' that apply dramatic, professional-looking camera moves and effects.\n\n" +
      "It is aimed at creators and marketers producing scroll-stopping clips quickly, with image-to-video and a fast, creator-friendly workflow.",
    highlights: [
      "Cinematic camera-motion presets",
      "'AI Director' for dramatic shots",
      "Built for social-media short video",
      "Image-to-video and effects",
      "Fast, creator-friendly workflow",
    ],
    bestFor: ["Social video", "Cinematic motion", "Marketing", "Creators"],
    specs: [
      { label: "Type", value: "Video generation" },
      { label: "Modality", value: "Text · Image → Video" },
      { label: "Access", value: "Web · Mobile" },
      { label: "Pricing", value: "Paid plans" },
    ],
  },
};
