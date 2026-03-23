/**
 * Type-safe environment variable access.
 *
 * Public variables use lazy getters so the module can be imported
 * at build time without throwing when env vars are not yet set
 * (e.g. during `next build` in CI).
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Public environment variables (safe to expose to browser).
 * Each property is a lazy getter — the value is resolved on first access,
 * not at module load time, so importing this module won't crash during
 * static analysis or build steps where env vars may be absent.
 */
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get NEXT_PUBLIC_SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
} as const;

/**
 * Server-only environment variables.
 * Access via serverEnv() — a function call prevents accidental
 * inclusion in client bundles (tree-shaking won't inline it).
 *
 * Security: SUPABASE_SERVICE_ROLE_KEY bypasses RLS and must NEVER
 * be exposed to the browser. Lazy-loading it in a function ensures
 * it's only resolved at runtime on the server.
 */
export function serverEnv() {
  return {
    SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  } as const;
}
