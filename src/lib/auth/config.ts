/**
 * Auth configuration. Source: environment variables (see .env.example).
 *
 * Modes:
 * - `AUTH_LOCAL_ONLY=1` (dev) — the app assumes the user is signed in with
 *   `DEFAULT_ACCESS_ROLE`; the guard never rejects. Used while backend/SSO is
 *   not yet available (plan.md R3).
 * - no `AUTH_LOCAL_ONLY` — normal mode; the guard is active, local login W0,
 *   Entra/SAML follows (W8).
 */
import { SSO_FALLBACK_KEY, SSO_UNLINKED_KEY } from "@/lib/constants/storage";

export const authConfig = {
  get localOnly(): boolean {
    return process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY === "1";
  },
  get defaultAccessRole(): string | undefined {
    // Used only in local-only mode.
    return this.localOnly ? process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE : undefined;
  },
};

/**
 * SSO browser hints (006-entra-sso-login, plan D8 "opsi A", task T023).
 *
 * Two markers break the redirect loop and remember a dead end, both purely
 * display hints in the browser — the server still decides accept/reject and
 * never reads them (contracts/sso-entra.md §9.6):
 *
 * - `tania:sso:fallback` (`sessionStorage`) — the user chose the email door, or
 *   came back from Microsoft with `?sso=error|cancelled`. While set, `/login`
 *   must not auto-redirect to Microsoft, so no loop is possible. Tab-scoped on
 *   purpose: a fresh tab may try SSO again.
 * - `tania:sso:unlinked` (`localStorage`) — the corporate account has no linked
 *   Tania account. That will still be true tomorrow, so it is remembered for
 *   7 days and `/login` goes straight to the email form instead of repeating a
 *   failing redirect on every visit.
 *
 * Both are cleared once a sign-in succeeds on either path.
 */
export const SSO_UNLINKED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Web storage can be absent (SSR) or blocked; hints must never break sign-in. */
function storage(kind: "session" | "local"): Storage | null {
  try {
    return kind === "session" ? sessionStorage : localStorage;
  } catch {
    return null;
  }
}

/** Remember that the email + password door was chosen (stops auto-redirect). */
export function markSsoFallback(): void {
  storage("session")?.setItem(SSO_FALLBACK_KEY, "1");
}

export function isSsoFallbackMarked(): boolean {
  return storage("session")?.getItem(SSO_FALLBACK_KEY) === "1";
}

/** Remember that the corporate account has no linked Tania account. */
export function markSsoUnlinked(now: number = Date.now()): void {
  storage("local")?.setItem(SSO_UNLINKED_KEY, String(now));
}

/** True while an unlinked mark is present and younger than the 7-day window. */
export function isSsoUnlinked(now: number = Date.now()): boolean {
  const store = storage("local");
  const markedAt = Number(store?.getItem(SSO_UNLINKED_KEY));
  if (!Number.isFinite(markedAt) || markedAt <= 0) return false;
  if (now - markedAt >= SSO_UNLINKED_TTL_MS) {
    store?.removeItem(SSO_UNLINKED_KEY);
    return false;
  }
  return true;
}

/** Clear both hints — called after a successful sign-in on the SSO or email path. */
export function clearSsoHints(): void {
  storage("session")?.removeItem(SSO_FALLBACK_KEY);
  storage("local")?.removeItem(SSO_UNLINKED_KEY);
}