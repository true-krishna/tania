import { LOGIN } from "@/lib/constants/routes";
import { decodeSession, isSessionExpired, type Session } from "@/lib/auth/session-codec";

const PUBLIC_ROUTES = [LOGIN];

/** Routes the gate must never block: the sign-in page and its subpaths. */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Decode the `tania_session` cookie value; null when absent or malformed. */
export function resolveSession(rawCookieValue: string | undefined): Session | null {
  return rawCookieValue ? decodeSession(rawCookieValue) : null;
}

/**
 * True when the visitor must sign in again: no session, or the refresh token is
 * expired. The Proxy uses this for its server-side redirect (src/proxy.ts).
 */
export function requiresSignIn(session: Session | null, now: number = Date.now()): boolean {
  return session === null || isSessionExpired(session, now);
}
