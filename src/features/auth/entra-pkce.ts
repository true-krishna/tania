/**
 * PKCE + state/nonce for the Microsoft Entra SSO flow (006-entra-sso-login,
 * plan D1/D3, task T022).
 *
 * Everything runs in the browser with Web Crypto only — no MSAL, no npm
 * dependency (Technical V, R-11): `crypto.getRandomValues` for the random
 * values and `crypto.subtle.digest("SHA-256")` for the code challenge (S256).
 *
 * The attempt lives in `sessionStorage`, not in memory: the authorization
 * request this file starts navigates the whole page away to Microsoft, and the
 * callback is a fresh page load that must present the same verifier, state and
 * nonce. `sessionStorage` also scopes the attempt to the tab that started it
 * and drops it when that tab closes.
 *
 * None of this is a security boundary. The callback compares `state` to reject
 * stray responses, and the backend re-validates `code_verifier` (PKCE binding)
 * and the ID token's `nonce` claim — a tampered browser store can only break its
 * own sign-in.
 */

/** `sessionStorage` key holding the single in-flight attempt. */
export const ENTRA_ATTEMPT_KEY = "tania:sso:attempt";

/**
 * Randomness sizes. RFC 7636 requires a `code_verifier` of 43–128 base64url
 * characters; 32 bytes encode to exactly 43. `state`/`nonce` only need to be
 * unguessable, so 16 bytes (22 characters) is plenty.
 */
const VERIFIER_BYTES = 32;
const STATE_BYTES = 16;
const NONCE_BYTES = 16;

/** One authorization attempt: what the callback must echo back to the backend. */
export interface EntraAuthAttempt {
  codeVerifier: string;
  state: string;
  nonce: string;
}

/** Base64url without padding, as required by RFC 7636 (§A.2) and OIDC `nonce`. */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** `byteLength` cryptographically random bytes, base64url-encoded. */
export function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** New `code_verifier` (43 base64url characters). */
export function createCodeVerifier(): string {
  return randomBase64Url(VERIFIER_BYTES);
}

/** S256 `code_challenge` = base64url(SHA-256(ASCII(code_verifier))). */
export async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function storageOrNull(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    // Storage can be blocked (private mode / hardened settings). The attempt
    // cannot survive the redirect without it, so it degrades to "no attempt" —
    // the callback then reports an invalid session instead of crashing.
    return null;
  }
}

/** Persist the attempt so the callback page (a fresh load) can read it back. */
export function saveEntraAuthAttempt(attempt: EntraAuthAttempt): void {
  storageOrNull()?.setItem(ENTRA_ATTEMPT_KEY, JSON.stringify(attempt));
}

/** Read the in-flight attempt without consuming it; null when absent/malformed. */
export function readEntraAuthAttempt(): EntraAuthAttempt | null {
  const raw = storageOrNull()?.getItem(ENTRA_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EntraAuthAttempt>;
    if (
      typeof parsed.codeVerifier === "string" &&
      typeof parsed.state === "string" &&
      typeof parsed.nonce === "string"
    ) {
      return { codeVerifier: parsed.codeVerifier, state: parsed.state, nonce: parsed.nonce };
    }
    return null;
  } catch {
    return null;
  }
}

/** Drop the attempt (used after a successful exchange and on mismatch). */
export function clearEntraAuthAttempt(): void {
  storageOrNull()?.removeItem(ENTRA_ATTEMPT_KEY);
}

/**
 * Start an attempt: generate verifier/state/nonce, remember them for the
 * callback, and return the S256 challenge to send to `entraSsoStart`.
 */
export async function beginEntraAuthAttempt(): Promise<{
  attempt: EntraAuthAttempt;
  codeChallenge: string;
}> {
  const attempt: EntraAuthAttempt = {
    codeVerifier: createCodeVerifier(),
    state: randomBase64Url(STATE_BYTES),
    nonce: randomBase64Url(NONCE_BYTES),
  };
  saveEntraAuthAttempt(attempt);
  return { attempt, codeChallenge: await createCodeChallenge(attempt.codeVerifier) };
}

/**
 * Consume the attempt (single use — removed as it is read). An authorization
 * code is short-lived and exchanged exactly once, so a stale attempt must never
 * be reused for a second callback.
 */
export function takeEntraAuthAttempt(): EntraAuthAttempt | null {
  const attempt = readEntraAuthAttempt();
  clearEntraAuthAttempt();
  return attempt;
}
