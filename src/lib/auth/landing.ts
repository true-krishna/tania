import type { AccessRole } from "@/generated/graphql";
import { ACCOUNTS, DASHBOARD, LOGIN, PROFILE } from "@/lib/constants/routes";

/**
 * Halaman muka setelah login per peran (TAN-343, umpan balik pemilik produk
 * 2026-10-27; TAN-392):
 *
 * - Operation & Chapter tetap mendarat di Dashboard (sel default READ).
 * - Admin tidak memegang sel Dashboard — langsung ke Accounts, fokus RBAC.
 * - Talent mendarat di Profil saya — menu item pertama di sidebar datar
 *   (TAN-392), menggantikan redirect Data Karyawan.
 *
 * Tanpa sesi (peran belum dikenali) kembali ke halaman login.
 */
export function landingRoute(role: AccessRole | null | undefined): string {
  if (!role) return LOGIN;
  switch (role) {
    case "ADMIN":
      return ACCOUNTS;
    case "TALENT":
      return PROFILE;
    default:
      // OPERATION & CHAPTER
      return DASHBOARD;
  }
}
