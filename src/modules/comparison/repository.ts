import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ModelSettings } from "@/modules/execution/types";
import type { ChoiceKind, ComparisonStatus } from "./types";

// comparisons · choices 접근 (서버 전용). 사용자 직접 조회는 막혀 있다 (R-8 보강 마이그레이션).

export interface ComparisonRow {
  id: string;
  user_id: string;
  task_id: string;
  task_type_id: string;
  sample_id: string;
  is_blind: boolean;
  status: ComparisonStatus;
  model_count: number;
  model_order: string[];
  settings: ModelSettings;
  source: string;
  created_at: string;
  completed_at: string | null;
}

export interface ChoiceRow {
  id: string;
  comparison_id: string;
  kind: ChoiceKind;
  chosen_run_id: string | null;
  was_blind: boolean;
  created_at: string;
}

const db = () => supabaseAdmin();

export async function insertComparison(c: {
  user_id: string;
  task_id: string;
  task_type_id: string;
  sample_id: string;
  is_blind: boolean;
  model_count: number;
  model_order: string[];
  settings: ModelSettings;
}): Promise<ComparisonRow> {
  const { data, error } = await db().from("comparisons").insert(c).select("*").single();
  if (error) throw new Error(`comparisons insert failed: ${error.message}`);
  return data as ComparisonRow;
}

export async function findComparison(id: string): Promise<ComparisonRow | null> {
  const { data, error } = await db().from("comparisons").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`comparisons select failed: ${error.message}`);
  return data as ComparisonRow | null;
}

/** 상태 전이. from이 맞을 때만 바꾼다 (동시 요청에도 한 번만 전이) */
export async function transition(
  id: string,
  from: ComparisonStatus[],
  to: ComparisonStatus,
  extra: Partial<Pick<ComparisonRow, "completed_at">> = {},
): Promise<ComparisonRow | null> {
  const { data, error } = await db()
    .from("comparisons")
    .update({ status: to, ...extra })
    .eq("id", id)
    .in("status", from)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`comparisons update failed: ${error.message}`);
  return data as ComparisonRow | null;
}

/** 오늘(since 이후) 만든 비교 중 한도에 세는 것 — 전부 실패한 비교는 세지 않는다 */
export async function countCountedSince(userId: string, since: string): Promise<number> {
  const { count, error } = await db()
    .from("comparisons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since)
    .neq("status", "failed");
  if (error) throw new Error(`comparisons count failed: ${error.message}`);
  return count ?? 0;
}

export async function findChoice(comparisonId: string): Promise<ChoiceRow | null> {
  const { data, error } = await db()
    .from("choices")
    .select("*")
    .eq("comparison_id", comparisonId)
    .maybeSingle();
  if (error) throw new Error(`choices select failed: ${error.message}`);
  return data as ChoiceRow | null;
}

export class ChoiceAlreadyMade extends Error {}

export async function insertChoice(c: {
  comparison_id: string;
  user_id: string;
  kind: ChoiceKind;
  chosen_run_id: string | null;
  was_blind: boolean;
  decision_ms: number | null;
}): Promise<ChoiceRow> {
  const { data, error } = await db().from("choices").insert(c).select("*").single();
  if (error) {
    if (error.code === "23505") throw new ChoiceAlreadyMade("already chosen");
    throw new Error(`choices insert failed: ${error.message}`);
  }
  return data as ChoiceRow;
}

export async function findSampleContent(sampleId: string): Promise<string> {
  const { data, error } = await db().from("samples").select("content").eq("id", sampleId).single();
  if (error) throw new Error(`samples select failed: ${error.message}`);
  return data.content as string;
}
