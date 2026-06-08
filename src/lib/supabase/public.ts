import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * 쿠키에 의존하지 않는 공개 읽기 전용 Supabase 클라이언트.
 *
 * server.ts의 createClient()는 cookies()(동적 API)를 호출해 그 라우트를
 * 강제로 동적 렌더링으로 만든다 → revalidate/ISR이 무효가 된다.
 * 이 클라이언트는 cookies()를 쓰지 않으므로, 이것만 사용하는 라우트는
 * 정적 생성/ISR 캐싱이 가능하다.
 *
 * 공개 데이터(기사·카테고리·모델 등) 읽기 전용으로만 사용할 것.
 * (anon 키 + RLS의 *_select_public 정책 범위 내에서만 접근 가능.
 *  로그인 사용자별 데이터/쓰기는 반드시 server.ts의 createClient()를 쓸 것.)
 */
export const supabasePublic = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
