/**
 * Type-safe environment variable access.
 *
 * Public variables use lazy getters so the module can be imported
 * at build time without throwing when env vars are not yet set
 * (e.g. during `next build` in CI).
 */

/**
 * Public environment variables (safe to expose to browser).
 * Each property is a lazy getter — the value is resolved on first access,
 * not at module load time, so importing this module won't crash during
 * static analysis or build steps where env vars may be absent.
 */
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    return value;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!value) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return value;
  },
  get NEXT_PUBLIC_SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
} as const;

// Server-only secrets live in ./env.server.ts (guarded by `server-only`),
// because this file is also imported by browser code (supabase/client.ts).
