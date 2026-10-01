/**
 * Konfigurasi auth. Sumber: variabel lingkungan (lihat .env.example).
 *
 * Mode:
 * - `AUTH_LOCAL_ONLY=1` (dev) — aplikasi menganggap user sudah login dengan
 *   `DEFAULT_ACCESS_ROLE`; guard tidak menolak. Dipakai saat backend/SSO
 *   belum tersedia (plan.md R3).
 * - tanpa `AUTH_LOCAL_ONLY` — mode normal; guard aktif, login lokal W0,
 *   Entra/SAML menyusul (W8).
 */
export const authConfig = {
  get localOnly(): boolean {
    return process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY === "1";
  },
  get defaultAccessRole(): string | undefined {
    // Dipakai hanya dalam mode local-only.
    return this.localOnly ? process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE : undefined;
  },
};