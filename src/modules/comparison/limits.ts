import "server-only";
import { ApiError } from "@/lib/api-error";
import { serverCostSince } from "@/modules/execution/service";
import { countCountedSince } from "./repository";

/**
 * 서버 키 한도 (R-26, docs/architecture.md §10-2).
 * 사용자 하루 5회 + 서비스 전체 하루 예산. OpenRouter 키 자체에도 $5 한도가 걸려 있다.
 * 하루의 기준은 한국 시간 자정.
 */

export const DAILY_COMPARISONS = 5;
export const SERVICE_DAILY_BUDGET_USD = 1;
export const MAX_MODELS = 3;
export const MIN_MODELS = 2;

/** 오늘 한국 시간 00:00을 UTC ISO 문자열로 */
export function kstMidnightIso(now = new Date()): string {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const midnightKstAsUtc = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
  return new Date(midnightKstAsUtc - KST_OFFSET_MS).toISOString();
}

export async function remainingToday(userId: string): Promise<number> {
  const used = await countCountedSince(userId, kstMidnightIso());
  return Math.max(0, DAILY_COMPARISONS - used);
}

/** 비교를 하나 더 만들어도 되나. 안 되면 ApiError */
export async function assertCanCreate(userId: string): Promise<void> {
  if ((await remainingToday(userId)) <= 0) {
    throw new ApiError(
      "daily_limit",
      429,
      `오늘 무료 비교 ${DAILY_COMPARISONS}회를 다 썼어요. 내일 다시 할 수 있어요`,
    );
  }
  if ((await serverCostSince(kstMidnightIso())) >= SERVICE_DAILY_BUDGET_USD) {
    throw new ApiError("service_budget", 503, "오늘 무료 비교가 모두 끝났어요. 내일 다시 할 수 있어요");
  }
}
