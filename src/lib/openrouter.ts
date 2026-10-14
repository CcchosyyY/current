import "server-only";
import { serverEnv } from "@/lib/env.server";
import { env } from "@/lib/env";

/**
 * OpenRouter adapter (docs/architecture.md §3-2 ⑦, plan-stage1 S3).
 *
 * The only file that talks HTTP to OpenRouter. It knows nothing about
 * comparisons, blind mode or task types: it sends one prompt to one model and
 * reports what came back — text, tokens, real cost, provider, timing — or a
 * classified failure. Translating user settings (R-27) into `ChatParams` is
 * the execution module's job.
 *
 * Measured on 2026-10-15 (plan-stage1 §2):
 *   - `usage: {include: true}` returns the real cost in `usage.cost`
 *   - `provider` is the upstream that served it (Claude Haiku 5.5 → Azure)
 *   - `model` echoes the requested ID, no version → callers record the
 *     catalog's canonical slug alongside it (R-12)
 *   - reasoning models can spend the whole max_tokens budget thinking and
 *     return an empty answer → reported as `empty_output`
 */

const BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 60_000;

// ── Chat ────────────────────────────────────────────────────────────────────

/** OpenRouter-level knobs. Omitted fields are not sent (model defaults). */
export interface ChatParams {
  reasoningEffort?: "low" | "high";
  maxTokens?: number;
}

export interface ChatSuccess {
  ok: true;
  text: string;
  responseModel: string | null;
  provider: string | null;
  systemFingerprint: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  costUsd: number | null; // null → caller estimates from catalog prices
  generationId: string | null;
  finishReason: string | null;
  latencyMs: number;
  sentParams: Record<string, unknown>; // exactly what was sent besides messages → runs.params
}

export type ChatFailureCode =
  | "timeout"
  | "rate_limited"
  | "insufficient_credits"
  | "provider_error"
  | "empty_output"
  | "unknown";

export interface ChatFailure {
  ok: false;
  code: ChatFailureCode;
  message: string;
  latencyMs: number;
  sentParams: Record<string, unknown>;
  // A response can fail (e.g. empty_output) yet still have been billed.
  costUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  responseModel: string | null;
  provider: string | null;
  generationId: string | null;
}

export type ChatResult = ChatSuccess | ChatFailure;

interface ChatRequest {
  model: string;
  prompt: string; // the sample, sent as-is (R-28: no hidden system prompt)
  params?: ChatParams;
  apiKey?: string; // defaults to the server key; a user key in stage 3
  timeoutMs?: number;
}

// Subset of the OpenRouter response we read.
interface OpenRouterChatResponse {
  id?: string;
  model?: string;
  provider?: string;
  system_fingerprint?: string | null;
  choices?: {
    finish_reason?: string | null;
    message?: { content?: string | null };
    error?: { message?: string };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
    completion_tokens_details?: { reasoning_tokens?: number };
  };
  error?: { code?: number; message?: string };
}

export function buildSentParams(params: ChatParams = {}): Record<string, unknown> {
  const sent: Record<string, unknown> = {
    usage: { include: true },
    // Never ship the model's thinking to us/the browser, only the answer.
    reasoning: { exclude: true },
  };
  if (params.reasoningEffort) {
    sent.reasoning = { effort: params.reasoningEffort, exclude: true };
  }
  if (params.maxTokens !== undefined) sent.max_tokens = params.maxTokens;
  return sent;
}

function classifyHttpError(status: number): ChatFailureCode {
  if (status === 402) return "insufficient_credits"; // key credit limit reached
  if (status === 429) return "rate_limited";
  if (status === 408) return "timeout";
  if (status >= 400) return "provider_error";
  return "unknown";
}

export async function chat(req: ChatRequest): Promise<ChatResult> {
  const sentParams = buildSentParams(req.params);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const started = Date.now();

  const fail = (
    code: ChatFailureCode,
    message: string,
    body?: OpenRouterChatResponse,
  ): ChatFailure => ({
    ok: false,
    code,
    message,
    latencyMs: Date.now() - started,
    sentParams,
    costUsd: body?.usage?.cost ?? null,
    inputTokens: body?.usage?.prompt_tokens ?? null,
    outputTokens: body?.usage?.completion_tokens ?? null,
    reasoningTokens: body?.usage?.completion_tokens_details?.reasoning_tokens ?? null,
    responseModel: body?.model ?? null,
    provider: body?.provider ?? null,
    generationId: body?.id ?? null,
  });

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${req.apiKey ?? serverEnv.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.NEXT_PUBLIC_SITE_URL,
        "X-Title": "Current",
      },
      body: JSON.stringify({
        model: req.model,
        messages: [{ role: "user", content: req.prompt }],
        ...sentParams,
      }),
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => ({}))) as OpenRouterChatResponse;

    if (!res.ok || body.error) {
      const code = classifyHttpError(res.ok ? (body.error?.code ?? 500) : res.status);
      return fail(code, body.error?.message ?? `HTTP ${res.status}`, body);
    }

    const choice = body.choices?.[0];
    if (choice?.error) {
      return fail("provider_error", choice.error.message ?? "Provider error", body);
    }

    const text = choice?.message?.content ?? "";
    if (!text.trim()) {
      const why =
        choice?.finish_reason === "length"
          ? "Token budget ran out before an answer (reasoning used it up)"
          : "Model returned an empty answer";
      return fail("empty_output", why, body);
    }

    return {
      ok: true,
      text,
      responseModel: body.model ?? null,
      provider: body.provider ?? null,
      systemFingerprint: body.system_fingerprint ?? null,
      inputTokens: body.usage?.prompt_tokens ?? null,
      outputTokens: body.usage?.completion_tokens ?? null,
      reasoningTokens: body.usage?.completion_tokens_details?.reasoning_tokens ?? null,
      costUsd: body.usage?.cost ?? null,
      generationId: body.id ?? null,
      finishReason: choice?.finish_reason ?? null,
      latencyMs: Date.now() - started,
      sentParams,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return fail("timeout", `No answer within ${(req.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s`);
    }
    return fail("unknown", err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}

// ── Model list ──────────────────────────────────────────────────────────────

export interface OpenRouterModel {
  id: string;
  canonicalSlug: string | null;
  name: string;
  promptPrice: number; // USD per token
  completionPrice: number;
  contextLength: number | null;
  modality: string | null; // e.g. "text->text"
}

interface OpenRouterModelsResponse {
  data?: {
    id: string;
    canonical_slug?: string;
    name?: string;
    context_length?: number;
    architecture?: { modality?: string };
    pricing?: { prompt?: string; completion?: string };
  }[];
}

export async function listModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${serverEnv.OPENROUTER_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`OpenRouter /models failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as OpenRouterModelsResponse;
  return (body.data ?? []).map((m) => ({
    id: m.id,
    canonicalSlug: m.canonical_slug ?? null,
    name: m.name ?? m.id,
    // Prices come as decimal strings; "-1" marks a variable-priced router.
    promptPrice: Number(m.pricing?.prompt ?? 0),
    completionPrice: Number(m.pricing?.completion ?? 0),
    contextLength: m.context_length ?? null,
    modality: m.architecture?.modality ?? null,
  }));
}
