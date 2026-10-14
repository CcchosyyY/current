import "server-only";
import { listModels, type OpenRouterModel } from "@/lib/openrouter";
import {
  deactivateNotSeenSince,
  selectAllIds,
  upsertMany,
  type CatalogUpsert,
} from "./repository";
import type { CatalogSyncResult } from "./types";

/**
 * OpenRouter 모델 목록 → catalog_models (plan-stage1 S4).
 *
 * - 비교 대상: 텍스트로 답하고 텍스트를 받는 모델 (modality "…text…->text").
 *   GPT-5 nano는 "text+image+file->text"라서 "text->text"만 고르면 빠진다 (S3 실측).
 * - 제외: "~" 별칭(최신 버전을 가리키는 포인터라 버전이 바뀐다 → R-12와 충돌),
 *   ":batch" 변형(바로 답하지 않음), openrouter/* 라우터, 가격이 음수인 라우터.
 * - 허용 목록(server_allowed)·기본 순서(default_rank)·처음 본 시각(first_seen_at)은
 *   동기화가 건드리지 않는다. 새 모델의 first_seen_at = 지금 → 새 모델 감지(4단계).
 */

// 공급사(ID 앞부분) → ai_models.slug. 기존 로고·브랜드색을 비교 화면에서 재사용한다.
const PROVIDER_TO_BRAND: Record<string, string> = {
  openai: "chatgpt",
  anthropic: "claude",
  google: "gemini",
  "x-ai": "grok",
  deepseek: "deepseek",
  mistralai: "mistral",
  "meta-llama": "meta-ai",
  meta: "meta-ai",
  qwen: "qwen",
  moonshotai: "kimi-k2",
  perplexity: "perplexity",
};

export function isComparable(m: OpenRouterModel): boolean {
  if (m.id.startsWith("~") || m.id.endsWith(":batch")) return false;
  if (m.id.startsWith("openrouter/")) return false;
  if (m.promptPrice < 0 || m.completionPrice < 0) return false;
  const [input = "", output = ""] = (m.modality ?? "").split("->");
  return output === "text" && input.split("+").includes("text");
}

/** "OpenAI: GPT-5 Nano" → "GPT-5 Nano" */
export function displayName(name: string): string {
  const i = name.indexOf(": ");
  return i > 0 ? name.slice(i + 2) : name;
}

export async function syncCatalog(): Promise<CatalogSyncResult> {
  // 이번 동기화의 "본 시각" 하나를 last_seen_at·first_seen_at에 같이 쓴다.
  // (DB 기본값 now()를 쓰면 저장 순간이 행 준비보다 늦어 first > last가 된다)
  const seenAt = new Date().toISOString();
  const fetched = await listModels();
  const comparable = fetched.filter(isComparable);

  const existing = await selectAllIds();
  const existingIds = new Set(existing.map((r) => r.id));

  const rows: CatalogUpsert[] = comparable.map((m) => {
    const provider = m.id.split("/")[0];
    return {
      id: m.id,
      canonical_slug: m.canonicalSlug,
      name: displayName(m.name),
      provider,
      ai_model_slug: PROVIDER_TO_BRAND[provider] ?? null,
      prompt_price: m.promptPrice,
      completion_price: m.completionPrice,
      is_free: m.id.endsWith(":free") || (m.promptPrice === 0 && m.completionPrice === 0),
      context_length: m.contextLength,
      modality: m.modality,
      last_seen_at: seenAt,
      is_active: true,
    };
  });

  // 새 모델과 기존 모델은 보내는 컬럼이 달라서 따로 보낸다 (한 요청 안의 행은 컬럼이 같아야 함)
  const added = rows.filter((r) => !existingIds.has(r.id)).map((r) => ({ ...r, first_seen_at: seenAt }));
  const updated = rows.filter((r) => existingIds.has(r.id));
  for (const batch of [added, updated]) {
    for (let i = 0; i < batch.length; i += 200) {
      await upsertMany(batch.slice(i, i + 200));
    }
  }
  const deactivated = await deactivateNotSeenSince(seenAt);

  const keptIds = new Set(rows.map((r) => r.id));
  const allowedMissing = existing
    .filter((r) => r.server_allowed && !keptIds.has(r.id))
    .map((r) => r.id);
  if (allowedMissing.length > 0) {
    console.warn("[catalog] allowlisted models missing from OpenRouter:", allowedMissing);
  }

  return {
    fetched: fetched.length,
    kept: rows.length,
    added: added.length,
    deactivated: deactivated.length,
    allowedMissing,
  };
}
