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
export const authConfig = {
  get localOnly(): boolean {
    return process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY === "1";
  },
  get defaultAccessRole(): string | undefined {
    // Used only in local-only mode.
    return this.localOnly ? process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE : undefined;
  },
};