import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabasePublic } from "@/lib/supabase/public";
import type { CatalogModel } from "./types";

// catalog_models 테이블 접근. 읽기는 공개 클라이언트(RLS: 누구나 SELECT),
// 쓰기는 관리자 클라이언트(동기화만 쓴다).

export interface CatalogRow {
  id: string;
  canonical_slug: string | null;
  name: string;
  provider: string;
  ai_model_slug: string | null;
  prompt_price: number | string;
  completion_price: number | string;
  is_free: boolean;
  context_length: number | null;
  modality: string | null;
  server_allowed: boolean;
  default_rank: number | null;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
}

/** 동기화가 쓰는 컬럼. server_allowed·default_rank·first_seen_at은 일부러 빠져 있다 */
export type CatalogUpsert = Pick<
  CatalogRow,
  | "id"
  | "canonical_slug"
  | "name"
  | "provider"
  | "ai_model_slug"
  | "prompt_price"
  | "completion_price"
  | "is_free"
  | "context_length"
  | "modality"
  | "last_seen_at"
  | "is_active"
> &
  // 새 모델에만 넣는다. 기존 모델 행에 넣으면 처음 본 시각이 덮어써진다.
  Partial<Pick<CatalogRow, "first_seen_at">>;

export function rowToModel(row: CatalogRow): CatalogModel {
  return {
    id: row.id,
    canonicalSlug: row.canonical_slug,
    name: row.name,
    provider: row.provider,
    brand: row.ai_model_slug,
    promptPrice: Number(row.prompt_price),
    completionPrice: Number(row.completion_price),
    isFree: row.is_free,
    contextLength: row.context_length,
    serverAllowed: row.server_allowed,
    defaultRank: row.default_rank,
  };
}

export async function selectActive(opts: { allowedOnly: boolean }): Promise<CatalogRow[]> {
  let query = supabasePublic.from("catalog_models").select("*").eq("is_active", true);
  if (opts.allowedOnly) {
    query = query.eq("server_allowed", true).order("default_rank", { ascending: true });
  } else {
    query = query
      .order("server_allowed", { ascending: false })
      .order("provider", { ascending: true })
      .order("name", { ascending: true });
  }
  const { data, error } = await query;
  if (error) throw new Error(`catalog select failed: ${error.message}`);
  return (data ?? []) as CatalogRow[];
}

export async function selectByIds(ids: string[]): Promise<CatalogRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabasePublic.from("catalog_models").select("*").in("id", ids);
  if (error) throw new Error(`catalog select failed: ${error.message}`);
  return (data ?? []) as CatalogRow[];
}

export async function selectAllIds(): Promise<{ id: string; server_allowed: boolean }[]> {
  const { data, error } = await supabaseAdmin().from("catalog_models").select("id, server_allowed");
  if (error) throw new Error(`catalog ids failed: ${error.message}`);
  return data ?? [];
}

export async function upsertMany(rows: CatalogUpsert[]): Promise<void> {
  // 새 행은 server_allowed=false, first_seen_at=now() 기본값을 받는다.
  // 기존 행은 위 컬럼만 덮어쓰고 나머지(허용 목록·처음 본 시각)는 그대로.
  const { error } = await supabaseAdmin().from("catalog_models").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`catalog upsert failed: ${error.message}`);
}

/** 이번 동기화에서 안 보인 모델을 비활성화하고, 비활성화된 ID를 돌려준다 */
export async function deactivateNotSeenSince(syncStartedAt: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin()
    .from("catalog_models")
    .update({ is_active: false })
    .lt("last_seen_at", syncStartedAt)
    .eq("is_active", true)
    .select("id");
  if (error) throw new Error(`catalog deactivate failed: ${error.message}`);
  return (data ?? []).map((r) => r.id as string);
}
