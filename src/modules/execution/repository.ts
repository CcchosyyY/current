import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { RunRecord, RunStatus } from "./types";

// runs 테이블. 추가만 한다(R-11): INSERT 한 번, "running → 끝" UPDATE 한 번, DELETE 없음.

interface RunRow {
  id: string;
  comparison_id: string | null;
  requested_model_id: string;
  display_position: number;
  status: RunStatus;
  output_text: string | null;
  error_code: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | string | null;
  latency_ms: number | null;
  provider_name: string | null;
}

function toRecord(r: RunRow): RunRecord {
  return {
    id: r.id,
    comparisonId: r.comparison_id,
    requestedModelId: r.requested_model_id,
    displayPosition: r.display_position,
    status: r.status,
    outputText: r.output_text,
    errorCode: r.error_code,
    inputTokens: r.input_tokens,
    outputTokens: r.output_tokens,
    costUsd: r.cost_usd === null ? null : Number(r.cost_usd),
    latencyMs: r.latency_ms,
    providerName: r.provider_name,
  };
}

export interface NewRun {
  comparison_id: string;
  user_id: string;
  task_type_id: string;
  sample_id: string;
  requested_model_id: string;
  model_canonical_slug: string | null;
  display_position: number;
  key_kind: "server" | "user";
  params: Record<string, unknown>;
}

export class RunsAlreadyStarted extends Error {}

/** 비교의 실행들을 한 번에 넣는다. 이미 넣었으면(같은 비교·위치) RunsAlreadyStarted */
export async function insertRuns(rows: NewRun[]): Promise<RunRecord[]> {
  const { data, error } = await supabaseAdmin().from("runs").insert(rows).select("*");
  if (error) {
    if (error.code === "23505") throw new RunsAlreadyStarted("runs already started");
    throw new Error(`runs insert failed: ${error.message}`);
  }
  return (data as RunRow[]).map(toRecord);
}

export interface RunCompletion {
  status: Exclude<RunStatus, "running">;
  response_model: string | null;
  provider_name: string | null;
  system_fingerprint: string | null;
  output_text: string | null;
  error_code: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  reasoning_tokens: number | null;
  cost_usd: number | null;
  cost_source: "openrouter" | "estimated" | null;
  latency_ms: number;
  openrouter_generation_id: string | null;
}

/** running인 행만 끝낼 수 있다 → 결과를 두 번 덮어쓰지 못한다 */
export async function completeRun(id: string, c: RunCompletion): Promise<RunRecord> {
  const { data, error } = await supabaseAdmin()
    .from("runs")
    .update({ ...c, finished_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "running")
    .select("*")
    .single();
  if (error) throw new Error(`runs complete failed (${id}): ${error.message}`);
  return toRecord(data as RunRow);
}

export async function listRunsOf(comparisonId: string): Promise<RunRecord[]> {
  const { data, error } = await supabaseAdmin()
    .from("runs")
    .select("*")
    .eq("comparison_id", comparisonId)
    .order("display_position");
  if (error) throw new Error(`runs select failed: ${error.message}`);
  return (data as RunRow[]).map(toRecord);
}

/** 서버 키로 since 이후 쓴 비용 합계 (서비스 하루 예산) */
export async function serverCostSince(since: string): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from("runs")
    .select("cost_usd")
    .eq("key_kind", "server")
    .gte("started_at", since);
  if (error) throw new Error(`runs cost failed: ${error.message}`);
  return (data ?? []).reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);
}
