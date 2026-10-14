import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { serverEnv } from "@/lib/env.server";

/**
 * 계정 모듈 (docs/architecture.md §3-2 ③).
 * 1단계: 로그인 확인 + 관리자 API 보호. 개인 키 연결·키 선택은 3단계.
 */

/** 로그인한 사용자. 없으면 401 (비교 영역의 모든 API는 로그인 필수). */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("unauthorized", 401, "로그인이 필요해요");
  }
  return user;
}

/** /api/admin/* 보호: 헤더 x-admin-secret이 ADMIN_SECRET과 같아야 한다. */
export function requireAdmin(request: Request): void {
  const given = request.headers.get("x-admin-secret");
  let expected: string;
  try {
    expected = serverEnv.ADMIN_SECRET;
  } catch {
    // 서버에 ADMIN_SECRET이 없으면 관리자 API는 아예 닫는다
    throw new ApiError("forbidden", 403, "Admin API is disabled");
  }
  // 길이가 다르면 timingSafeEqual이 throw하므로 먼저 거른다
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError("forbidden", 403, "Forbidden");
  }
}
