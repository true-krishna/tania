import { decodeSession, encodeSession, type Session } from "@/lib/auth/session-codec";
import { SESSION_COOKIE } from "@/lib/constants/storage";

export type { Session };
export { decodeSession, encodeSession };

/**
 * Browser session store, backed by a cookie.
 *
 * The access- and refresh-token session is persisted in a single client-readable
 * cookie (`SESSION_COOKIE`) instead of an in-memory module variable, so a page
 * reload keeps the user signed in. The cookie is `HttpOnly=false` because the
 * Apollo auth link must read the token client-side to build the Authorization
 * header, and the refresh link must read the refresh token to rehydrate an
 * expired session.
 *
 * The refresh token lets the client silently recover a valid access token when
 * one expires (refresh link in `src/lib/apollo/client.ts`); it is only cleared
 * (forcing sign-in again) when the refresh itself fails. The server-side Proxy
 * reads the same cookie via the shared codec (src/lib/auth/session-codec.ts).
 */
/** 4KB is the practical per-cookie size ceiling. */
const MAX_COOKIE_LENGTH = 4096;

type SessionListener = () => void;

const listeners = new Set<SessionListener>();

let snapshot: Session | null | undefined;
let snapshotRaw: string | null | undefined;

function notify() {
  for (const listener of [...listeners]) listener();
}

export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable snapshot for `useSyncExternalStore`; decoded once per cookie write. */
export function getSessionSnapshot(): Session | null {
  if (typeof document === "undefined") return null;
  const raw = readCookieValue(document.cookie);
  if (snapshot === undefined || raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = raw ? decodeSession(raw) : null;
  }
  return snapshot;
}

export function getServerSessionSnapshot(): Session | null {
  return null;
}

function readSession(): Session | null {
  if (typeof document === "undefined") return null;
  const raw = readCookieValue(document.cookie);
  return raw ? decodeSession(raw) : null;
}

/** "Ingat saya" persistence window; actual validity still ends with the
 * backend-issued refresh token, so this only keeps the cookie across browser
 * restarts, it never extends token life. */
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

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
  return readSession();
}

export function setSession(
  next: Session | null,
  options?: { remember?: boolean },
): void {
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
  // Without `remember` the cookie stays a browser-session cookie: closing the
  // browser signs the user out. With it, the cookie survives restarts.
  const maxAge = options?.remember ? `; Max-Age=${REMEMBER_ME_MAX_AGE}` : "";
  document.cookie = `${SESSION_COOKIE}=${encoded}; ${cookieAttributes()}${maxAge}`;
  snapshot = next;
  snapshotRaw = encoded;
  notify();
}

export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; ${cookieAttributes()}; Max-Age=0`;
  snapshot = null;
  snapshotRaw = null;
  notify();
}
