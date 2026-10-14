import "server-only";

/**
 * Server-only environment variables.
 *
 * `server-only` makes the build fail if a Client Component imports this file,
 * so these secrets can never end up in a browser bundle. Each value is a lazy
 * getter: a missing key only throws when that key is actually used, so e.g.
 * the news pages keep working without OPENROUTER_API_KEY.
 *
 * - SUPABASE_SERVICE_ROLE_KEY bypasses RLS — server writes only (lib/supabase/admin.ts)
 * - OPENROUTER_API_KEY is the server key for allowlisted models (R-25, lib/openrouter.ts)
 * - ANTHROPIC_API_KEY is the judge LLM (task type grouping, lib/judge-llm.ts)
 * - ADMIN_SECRET guards /api/admin/* routes
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get OPENROUTER_API_KEY() {
    return required("OPENROUTER_API_KEY");
  },
  get ANTHROPIC_API_KEY() {
    return required("ANTHROPIC_API_KEY");
  },
  get ADMIN_SECRET() {
    return required("ADMIN_SECRET");
  },
} as const;
