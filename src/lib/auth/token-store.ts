import type { AccessRole } from "@/generated/graphql";

/**
 * Browser session store, backed by a cookie.
 *
 * The access-token session is persisted in a single client-readable cookie
 * (`tania_session`) instead of an in-memory module variable, so a page reload
 * keeps the user signed in. The cookie is `HttpOnly=false` because the Apollo
 * auth link must read the token client-side to build the Authorization header.
 *
 * Hardening (refresh token in an HttpOnly cookie, server-side `refreshSession`
 * rehydration) lands with the real backend auth module (plan.md W8) once the
 * backend GraphQL API is merged and reachable.
 */
export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  accessRole: AccessRole;
}

const SESSION_COOKIE = "tania_session";
/** 4KB is the practical per-cookie size ceiling. */
const MAX_COOKIE_LENGTH = 4096;

/**
 * Encode a session into a cookie-safe value. `encodeURIComponent` URL-encodes
 * characters that are not allowed raw in a cookie value (`;`, `,`, whitespace,
 * quotes), so the JSON round-trips unambiguously.
 */
export function encodeSession(session: Session): string {
  return encodeURIComponent(JSON.stringify(session));
}

/** Inverse of {@link encodeSession}; returns null when the value is malformed. */
export function decodeSession(raw: string): Session | null {
  try {
    const session = JSON.parse(decodeURIComponent(raw)) as Partial<Session>;
    if (
      typeof session.accessToken === "string" &&
      typeof session.accessTokenExpiresAt === "string" &&
      typeof session.accessRole === "string"
    ) {
      return session as Session;
    }
    return null;
  } catch {
    return null;
  }
}

function readCookieValue(cookie: string): string | null {
  const match = cookie.match(
    new RegExp("(?:^|; )" + SESSION_COOKIE + "=([^;]*)")
  );
  return match ? match[1] : null;
}

/** Build cookie attributes; `Secure` only over HTTPS (localhost dev excluded). */
function cookieAttributes(): string {
  const secure = typeof document !== "undefined" && document.location.protocol === "https:";
  return `Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function getSession(): Session | null {
  if (typeof document === "undefined") return null;
  const raw = readCookieValue(document.cookie);
  return raw ? decodeSession(raw) : null;
}

export function setSession(next: Session | null): void {
  if (typeof document === "undefined") return;
  if (!next) {
    clearSession();
    return;
  }
  const encoded = encodeSession(next);
  if (encoded.length > MAX_COOKIE_LENGTH) {
    clearSession();
    return;
  }
  document.cookie = `${SESSION_COOKIE}=${encoded}; ${cookieAttributes()}`;
}

export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; ${cookieAttributes()}; Max-Age=0`;
}