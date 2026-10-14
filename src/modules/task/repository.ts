import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TaskType } from "./types";

// task_types · tasks · samples 접근. 모두 서버(service role)에서만 부른다.
// 사용자 소유 확인은 이 파일의 호출자(service)가 user_id 조건으로 한다.

export interface TaskTypeRow extends TaskType {
  description: string | null;
  merged_into: string | null;
  is_unclassified: boolean;
}

export interface TaskRow {
  id: string;
  user_id: string;
  name: string;
  name_normalized: string;
  task_type_id: string;
  classified_by: "judge" | "user_pick" | "fallback";
}

const db = () => supabaseAdmin();

export async function findTypeById(id: string): Promise<TaskTypeRow | null> {
  const { data, error } = await db().from("task_types").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`task_types select failed: ${error.message}`);
  return data as TaskTypeRow | null;
}

export async function findTypeByKey(key: string): Promise<TaskTypeRow | null> {
  const { data, error } = await db().from("task_types").select("*").eq("key", key).maybeSingle();
  if (error) throw new Error(`task_types select failed: ${error.message}`);
  return data as TaskTypeRow | null;
}

/** 병합을 따라가 살아남은 유형을 돌려준다 (병합 고리 방지로 최대 10단계) */
export async function resolveMerged(type: TaskTypeRow): Promise<TaskTypeRow> {
  let current = type;
  for (let i = 0; i < 10 && current.merged_into; i++) {
    const next = await findTypeById(current.merged_into);
    if (!next) break;
    current = next;
  }
  return current;
}

export async function findUnclassified(): Promise<TaskTypeRow> {
  const { data, error } = await db().from("task_types").select("*").eq("is_unclassified", true).single();
  if (error || !data) throw new Error(`unclassified type missing: ${error?.message}`);
  return data as TaskTypeRow;
}

/** 판정 AI에 넘길 살아 있는 유형 전체 (미분류·병합된 것 제외) */
export async function listActiveTypes(): Promise<TaskTypeRow[]> {
  const { data, error } = await db()
    .from("task_types")
    .select("*")
    .is("merged_into", null)
    .eq("is_unclassified", false)
    .order("created_at");
  if (error) throw new Error(`task_types list failed: ${error.message}`);
  return (data ?? []) as TaskTypeRow[];
}

/** 유형별로 실제 묶인 작업 이름 예시 (판정 AI가 유형의 범위를 이해하도록). 화면에는 안 나간다 */
export async function exampleNamesByType(perType = 5): Promise<Map<string, string[]>> {
  const { data, error } = await db()
    .from("tasks")
    .select("task_type_id, name")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`tasks examples failed: ${error.message}`);
  const out = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = out.get(row.task_type_id) ?? [];
    if (list.length < perType && !list.includes(row.name)) list.push(row.name);
    out.set(row.task_type_id, list);
  }
  return out;
}

export async function insertType(t: {
  key: string;
  name: string;
  description: string;
}): Promise<{ row: TaskTypeRow; created: boolean }> {
  const { data, error } = await db()
    .from("task_types")
    .insert({ ...t, created_by: "judge" })
    .select("*")
    .single();
  if (error) {
    // 동시에 같은 키가 만들어졌으면 그쪽을 쓴다
    if (error.code === "23505") {
      const existing = await findTypeByKey(t.key);
      if (existing) return { row: existing, created: false };
    }
    throw new Error(`task_types insert failed: ${error.message}`);
  }
  return { row: data as TaskTypeRow, created: true };
}

export async function findMyTask(userId: string, normalized: string): Promise<TaskRow | null> {
  const { data, error } = await db()
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("name_normalized", normalized)
    .maybeSingle();
  if (error) throw new Error(`tasks select failed: ${error.message}`);
  return data as TaskRow | null;
}

/** 작업 저장. 같은 이름이 동시에 저장되면(unique 충돌) 먼저 저장된 행을 돌려준다 */
export async function insertTask(t: Omit<TaskRow, "id">): Promise<TaskRow> {
  const { data, error } = await db().from("tasks").insert(t).select("*").single();
  if (error) {
    if (error.code === "23505") {
      const existing = await findMyTask(t.user_id, t.name_normalized);
      if (existing) return existing;
    }
    throw new Error(`tasks insert failed: ${error.message}`);
  }
  return data as TaskRow;
}

export async function findTaskById(id: string): Promise<TaskRow | null> {
  const { data, error } = await db().from("tasks").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`tasks select failed: ${error.message}`);
  return data as TaskRow | null;
}

export async function insertSample(s: {
  task_id: string;
  user_id: string;
  content: string;
  content_hash: string;
}): Promise<{ id: string }> {
  const { data, error } = await db().from("samples").insert(s).select("id").single();
  if (error) throw new Error(`samples insert failed: ${error.message}`);
  return data as { id: string };
}

export async function suggestTypes(
  q: string,
  limit: number,
): Promise<{ id: string; name: string; comparisons: number }[]> {
  const { data, error } = await db().rpc("suggest_task_types", { q, max_results: limit });
  if (error) throw new Error(`suggest_task_types failed: ${error.message}`);
  return (data ?? []).map((r: { id: string; name: string; comparisons: number | string }) => ({
    id: r.id,
    name: r.name,
    comparisons: Number(r.comparisons),
  }));
}

/** 내가 예전에 쓴 작업 이름 중 q를 포함하는 것 */
export async function searchMyTasks(
  userId: string,
  q: string,
  limit: number,
): Promise<{ name: string; task_type_id: string }[]> {
  // ILIKE 패턴 문자(% _ \)는 글자 그대로 찾도록 이스케이프
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const { data, error } = await db()
    .from("tasks")
    .select("name, task_type_id")
    .eq("user_id", userId)
    .ilike("name", pattern)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`tasks search failed: ${error.message}`);
  return data ?? [];
}

export async function typesByIds(ids: string[]): Promise<Map<string, TaskTypeRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db().from("task_types").select("*").in("id", ids);
  if (error) throw new Error(`task_types select failed: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.id as string, r as TaskTypeRow]));
}
