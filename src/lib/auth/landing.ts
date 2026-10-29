import type { AccessRole } from "@/generated/graphql";
import { ACCOUNTS, DASHBOARD, EMPLOYEES, LOGIN } from "@/lib/constants/routes";

/**
 * Halaman muka setelah login per peran (TAN-343, umpan balik pemilik produk
 * 2026-10-27):
 *
 * - Operation & Chapter tetap mendarat di Dashboard (sel default READ).
 * - Admin tidak memegang sel Dashboard — langsung ke Accounts, fokus RBAC.
 * - Talent tidak memegang sel Dashboard/Assignment — langsung ke Data Karyawan
 *   untuk melihat record miliknya (profil tetap lewat menu).
 *
 * Tanpa sesi (peran belum dikenali) kembali ke halaman login.
 *
 * TAN-373: landing stays static by design. It runs right after sign-in, before
 * `myMenuConfig` has answered, so an effective-config landing would either
 * bounce on the first paint or trust a stale grid. It is a navigation hint, not
 * an authorization decision: no page redirects back into it, and a role whose
 * historical landing cell is hidden sees AccessDenied instead of a bounce. The
 * approved Admin landing (`/accounts`) therefore does not move.
 */
export function landingRoute(role: AccessRole | null | undefined): string {
  if (!role) return LOGIN;
  switch (role) {
    case "ADMIN":
      return ACCOUNTS;
    case "TALENT":
      return EMPLOYEES;
    default:
      // OPERATION & CHAPTER
      return DASHBOARD;
  }
}
