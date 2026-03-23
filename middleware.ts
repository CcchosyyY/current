import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication — unauthenticated users
// are redirected to the home page.
const PROTECTED_ROUTES = ["/saved"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Redirect unauthenticated users away from protected pages
  const { pathname } = request.nextUrl;
  if (!user && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
