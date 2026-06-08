/**
 * Security utilities for the Current platform.
 * All user inputs that touch the database or are rendered in HTML
 * should be sanitized through these helpers.
 */

// ============================================================
// 1. INPUT SANITIZATION — XSS prevention
// ============================================================

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/** Escape HTML entities to prevent XSS in rendered output. */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/** Strip all HTML tags from a string. */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Sanitize a generic text input: trim, strip HTML, limit length. */
export function sanitizeInput(input: string, maxLength = 1000): string {
  return stripHtml(input).trim().slice(0, maxLength);
}

// ============================================================
// 2. EMAIL VALIDATION
// ============================================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Validate an email address format (not exhaustive, but good enough). */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ============================================================
// 3. RATE LIMITING (in-memory, per-instance)
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter.
 *
 * Suitable for Vercel serverless (per-invocation isolation).
 * For production at scale, swap this with an Upstash Redis rate limiter
 * (e.g., @upstash/ratelimit) which persists across cold starts.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   if (!limiter.check(ip)) return new Response("Too many requests", { status: 429 });
 */
export function createRateLimiter(opts: { windowMs: number; max: number }) {
  const store = new Map<string, RateLimitEntry>();

  return {
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      // Clean up expired entry
      if (entry && now > entry.resetAt) {
        store.delete(key);
      }

      const current = store.get(key);
      if (!current) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs });
        return true; // allowed
      }

      if (current.count >= opts.max) {
        return false; // rate limited
      }

      current.count++;
      return true; // allowed
    },
  };
}

// ============================================================
// 4. CSRF PROTECTION NOTES
// ============================================================
// Next.js 15 handles CSRF for Server Actions automatically by
// checking the Origin header against the Host header.
//
// For our API Route Handlers:
// - We rely on SameSite=Lax cookies (Supabase default) which
//   prevent cross-site cookie sending on POST/PUT/DELETE.
// - For extra safety, API routes that mutate data should verify
//   the Origin or Referer header matches our domain.
// - Supabase RLS is the ultimate guard: even if a CSRF attack
//   lands, the JWT in the cookie scopes the mutation to the
//   authenticated user's own rows only.

/** Verify the request origin matches our site. */
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // For mutation requests, require at least Origin or Referer
  const source = origin || referer;
  if (!source) return false;

  let sourceHost: string;
  try {
    sourceHost = new URL(source).host;
  } catch {
    return false;
  }

  // Primary check: the source host must match the host the request was
  // actually sent to. This works on any port/domain (dev or prod) without
  // hardcoding, and still blocks cross-origin requests. Behind a proxy the
  // public host arrives in x-forwarded-host.
  const requestHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (requestHost && sourceHost === requestHost) return true;

  // Fallback: an explicitly configured site URL (covers setups where the
  // Host header is rewritten and x-forwarded-host is unavailable).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      if (sourceHost === new URL(siteUrl).host) return true;
    } catch {
      // ignore malformed config
    }
  }

  return false;
}

/** Safely parse JSON body, returning null on failure. */
export async function safeParseBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}
