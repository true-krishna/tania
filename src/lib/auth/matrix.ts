import type { AccessRole } from "@/generated/graphql";

/**
 * UI mirror of the role & module matrix (specs/002-tania-rbac/spec.md). A
 * module opens only for the roles it lists (deny-by-default, FR-03). TAN-178
 * re-opens IDP & Evaluation on this line to follow the feature/design baseline;
 * the backend remains the enforcement point (FR-15/16). TAN-212 (clarify 4)
 * gives Admin full manage on every active module.
 *
 * 2026-10-16 (clarify 5/6): the active modules below mirror the
 * amended matrix — Kontrak `+CHAPTER` (scoped read), Master Data
 * `[CHAPTER, OPERATION, ADMIN]` (Talent has no access).
 *
 * 2026-10-29 (TAN-372): CV is no longer a module of its own — it lives inside
 * the talent profile, so it has no menu matrix row.
 *
 * 2026-10-16 (clarify 9 — aktivasi): IDP & Evaluation are active, so every role
 * has an entry (`ALL`): Admin kelola · Operation lihat · Chapter `kelola cakupan`
 * · Talent kelola miliknya. The menu entry is therefore visible for all roles
 * while `MANAGE_ROLES` decides what each role may do inside the page — Operation
 * only reads, Talent only its own records, and the pages mirror that. Period &
 * template administration stays Admin-only (global config), exactly like the
 * server's `RequireRole(Admin)` on their writes.
 *
 * 2026-10-27 (TAN-343): sel default mengikuti definisi peran baru — Admin hanya
 * fokus RBAC + Master Data + Audit (tanpa Karyawan/Kontrak/Assignment/Entra/
 * Dashboard), Dashboard hanya Operation & Chapter, dan Talent tanpa Assignment
 * & Dashboard (fitur self-service ditunda). Backend tetap titik penegakan.
 *
 * 2026-10-29 (TAN-374, keputusan TAN-364): Admin kembali memegang Dashboard,
 * Data Karyawan, Kontrak, Assignments dan Provisi Entra; modul Workload keluar
 * dari matriks (menu disembunyikan sampai TAN-378).
 */
export type Module =
  | "dashboard"
  | "activities"
  | "employees"
  | "entra"
  | "contracts"
  | "assignments"
  | "idp"
  | "evaluations"
  | "masterData"
  | "accounts"
  | "audit";

const ALL: readonly AccessRole[] = ["TALENT", "CHAPTER", "OPERATION", "ADMIN"];

export const MODULE_ROLES: Record<Module, readonly AccessRole[]> = {
  dashboard: ["ADMIN", "OPERATION", "CHAPTER"],
  activities: ALL,
  employees: ["ADMIN", "OPERATION", "CHAPTER", "TALENT"],
  entra: ["ADMIN", "OPERATION"],
  contracts: ["ADMIN", "OPERATION", "CHAPTER"],
  assignments: ["ADMIN", "OPERATION", "CHAPTER"],
  // Aktif sejak 2026-10-16 (klarifikasi 9): Admin kelola · Operation lihat ·
  // Chapter kelola cakupan · Talent kelola miliknya.
  idp: ALL,
  evaluations: ALL,
  masterData: ["CHAPTER", "OPERATION", "ADMIN"],
  accounts: ["ADMIN"],
  audit: ["ADMIN"],
};

const MANAGE_ROLES: Partial<Record<Module, readonly AccessRole[]>> = {
  employees: ["ADMIN", "OPERATION"],
  assignments: ["ADMIN", "CHAPTER"],
  contracts: ["ADMIN", "OPERATION"],
  entra: ["ADMIN", "OPERATION"],
  masterData: ["ADMIN"],
  // IDP & evaluasi: Chapter menilai/mengelola dalam cakupannya, Admin penuh;
  // Operation hanya membaca dan Talent hanya miliknya (kontrol "miliknya" ada di
  // halaman masing-masing, bukan di `canManage`).
  idp: ["CHAPTER", "ADMIN"],
  evaluations: ["CHAPTER", "ADMIN"],
};

export function canManage(role: AccessRole | null | undefined, module: Module): boolean {
  if (!role) return false;
  return (MANAGE_ROLES[module] ?? []).includes(role);
}

export function canAccess(role: AccessRole | null | undefined, module: Module): boolean {
  if (!role) return false;
  return MODULE_ROLES[module].includes(role);
}

/**
 * A module is open when at least one role may reach it. After the 2026-10-16
 * activation (klarifikasi 9) no module is closed, but the predicate stays as the
 * single switch the route layouts (`/idp`, `/evaluations`) use, so a future
 * deferral only has to empty a `MODULE_ROLES` row again.
 */
export function isModuleOpen(module: Module): boolean {
  return MODULE_ROLES[module].length > 0;
}
