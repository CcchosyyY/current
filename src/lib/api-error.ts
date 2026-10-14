import { NextResponse } from "next/server";

/**
 * Error format shared by the comparison API routes:
 *   { "error": { "code": "daily_limit", "message": "…" } }
 *
 * Modules throw ApiError; routes catch everything with toErrorResponse(),
 * so an unexpected exception becomes a 500 without leaking internals.
 * Codes are listed in docs/plan-stage1.md (S7 error table).
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error("Unexpected API error:", err);
  return NextResponse.json(
    { error: { code: "internal", message: "Internal server error" } },
    { status: 500 },
  );
}
