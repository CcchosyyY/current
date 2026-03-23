import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, sanitizeInput, verifyOrigin, createRateLimiter, safeParseBody } from "@/lib/security";

// Rate limit: 5 subscribe attempts per minute per IP
const subscribeLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

const SubscribeSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    // Security: verify request origin to prevent CSRF attacks
    if (!verifyOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!subscribeLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await safeParseBody(request);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Double-check with our own validator (defense in depth)
    const email = sanitizeInput(parsed.data.email, 254).toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      // Unique constraint = already subscribed
      if (error.code === "23505") {
        // Return success to avoid leaking whether an email is subscribed
        // (prevents email enumeration attacks)
        const existing = NextResponse.json({
          message: "Thank you for subscribing!",
        });
        existing.headers.set("Cache-Control", "no-store");
        return existing;
      }
      console.error("Newsletter subscribe error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 },
      );
    }

    const created = NextResponse.json(
      { message: "Thank you for subscribing!" },
      { status: 201 },
    );
    created.headers.set("Cache-Control", "no-store");
    return created;
  } catch (err) {
    console.error("Unexpected error in POST /api/newsletter/subscribe:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
