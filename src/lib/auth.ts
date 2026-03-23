import { createClient } from "@/lib/supabase/server";
import { type User } from "@supabase/supabase-js";

/**
 * Get the currently authenticated user, or null if not logged in.
 * Use this in Server Components and Route Handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication — returns the user or throws a Response
 * that Route Handlers can return directly.
 *
 * Usage in a Route Handler:
 *   const user = await requireAuth();
 *   // if we get here, user is guaranteed non-null
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

/**
 * Helper to build the Google OAuth redirect URL.
 * Call this from a Route Handler that the "Sign in with Google" button hits.
 */
export async function signInWithGoogle(redirectTo: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
