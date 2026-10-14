import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Service-role Supabase client — bypasses RLS.
 *
 * The comparison tables (tasks, samples, comparisons, runs, choices …) give
 * users SELECT on their own rows only; every write goes through this client
 * from server modules (src/modules/*), which check ownership themselves.
 *
 * Never pass data from this client to the browser without filtering it first
 * (e.g. blind comparisons must go through comparison/blind.ts — R-8).
 */
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
