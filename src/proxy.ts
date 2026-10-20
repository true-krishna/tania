import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { isPublicRoute, requiresSignIn, resolveSession } from "@/lib/auth/route-gate";
import { LOGIN } from "@/lib/constants/routes";
import { SESSION_COOKIE } from "@/lib/constants/storage";

/**
 * Server-side session gate (Next.js "Proxy", the Next 16 rename of middleware).
 * Runs before routes render, so a missing or expired session redirects to
 * /login with a 307 instead of letting the client-only `AuthGuard` paint the
 * app shell first and redirect after hydration (the visible flash).
 *
 * Optimistic by design: it only reads the cookie, never the backend. The
 * backend stays the enforcement point (FR-15/16), and a session revoked while
 * the cookie is still fresh is caught by the Apollo refresh link
 * (src/lib/apollo/client.ts) on the next request.
 */
export function proxy(request: NextRequest) {
  if (authConfig.localOnly) return NextResponse.next();

  if (isPublicRoute(request.nextUrl.pathname)) return NextResponse.next();

  const session = resolveSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (requiresSignIn(session)) {
    return NextResponse.redirect(new URL(LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals and static/media assets.
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
