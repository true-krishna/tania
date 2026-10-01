import type { AccessRole } from "@/generated/graphql";

/**
 * Penyimpanan sesi di sisi klien.
 *
 * Sesuai plan.md §5.2, access token disimpan **in-memory** (tidak di
 * localStorage) untuk memperkecil permukaan serangan XSS; refresh token
 * dipegang server (HttpOnly cookie) dan ditukar lewat mutation
 * `refreshToken`. Karena in-memory, reload halaman = sesi baru yang
 * membutuhkan refresh dari cookie server.
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