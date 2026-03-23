import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Server-side Supabase client for RSC / Route Handlers.
 * Reads and writes auth cookies automatically via Next.js cookies() API.
 *
 * Must be called inside a Server Component, Server Action, or Route Handler.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll can throw in Server Components (read-only).
            // This is expected — cookies are only writable in
            // Server Actions and Route Handlers.
          }
        },
      },
    },
  );
}
