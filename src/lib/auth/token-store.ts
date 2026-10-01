import type { AccessRole } from "@/generated/graphql";

/**
 * Client-side session store.
 *
 * Per plan.md §5.2, the access token is kept **in-memory** (not in
 * localStorage) to reduce the XSS attack surface; the refresh token lives
 * server-side (HttpOnly cookie) and is exchanged via the `refreshToken`
 * mutation. Because it is in-memory, a page reload means a fresh session
 * that must be rehydrated from the server cookie.
 */
export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  accessRole: AccessRole;
}

let session: Session | null = null;

export function getSession(): Session | null {
  return session;
}

export function setSession(next: Session | null): void {
  session = next;
}

export function clearSession(): void {
  session = null;
}