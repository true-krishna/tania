import type { AccessRole } from "@/generated/graphql";

/**
 * Session codec shared by the browser token-store and the server-side Proxy
 * (src/proxy.ts). Kept free of DOM and Next APIs so the same session cookie
 * value encodes/decodes identically on both sides.
 */
export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  accessRole: AccessRole;
  /** Profile name from `login`/`refreshSession`; absent in sessions stored before these fields existed. */
  fullName?: string;
  email?: string;
}

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
      typeof session.refreshToken === "string" &&
      typeof session.refreshTokenExpiresAt === "string" &&
      typeof session.accessRole === "string"
    ) {
      return {
        accessToken: session.accessToken,
        accessTokenExpiresAt: session.accessTokenExpiresAt,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
        accessRole: session.accessRole as AccessRole,
        fullName: typeof session.fullName === "string" ? session.fullName : undefined,
        email: typeof session.email === "string" ? session.email : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * True when the session cannot be recovered: the refresh token is past its
 * expiry, or the expiry is unreadable (fail closed). Access-token expiry is
 * ignored on purpose — the Apollo refresh link rotates it silently.
 */
export function isSessionExpired(session: Session, now: number = Date.now()): boolean {
  const expiresAt = Date.parse(session.refreshTokenExpiresAt);
  return Number.isNaN(expiresAt) || expiresAt <= now;
}
