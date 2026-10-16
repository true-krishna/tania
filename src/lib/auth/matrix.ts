import type { AccessRole } from "@/generated/graphql";

/**
 * UI mirror of the role & module matrix (specs/002-tania-rbac/spec.md). A
 * module opens only for the roles it lists (deny-by-default, FR-03). TAN-178
 * re-opens IDP & Evaluation on this line to follow the feature/design baseline;
 * the backend remains the enforcement point (FR-15/16). TAN-212 (clarify 4)
 * gives Admin full manage on every active module.
 *
 * 2026-10-16 (clarify 5/6 + "rekam akses sekarang, aktifkan nanti"): the active
 * modules below mirror the amended matrix — Kontrak `+CHAPTER` (scoped read),
 * CV `+OPERATION` (read-only), Master Data `[CHAPTER, OPERATION, ADMIN]`
 * (Talent has no access). The `idp`/`evaluations` rows are `[]` (T032): the
 * modules are deferred, so no role may reach them in the UI either, exactly as
 * the backend refuses them with MODULE_UNAVAILABLE (`internal/usecase/rbac.go`
 * deferredModules). Their recorded mapping — Admin kelola · Operation lihat ·
 * Chapter `kelola cakupan` · Talent kelola miliknya, i.e. all four roles — is
 * kept in the matrix SoT and in the nav entries, which activation restores
 * together with this row and the server flag (T084).
 */
export type Module =
  | "dashboard"
  | "activities"
  | "workload"
  | "employees"
  | "entra"
  | "contracts"
  | "assignments"
  | "idp"
  | "evaluations"
  | "cv"
  | "masterData"
  | "accounts"
  | "audit";

const ALL: readonly AccessRole[] = ["TALENT", "CHAPTER", "OPERATION", "ADMIN"];

export const MODULE_ROLES: Record<Module, readonly AccessRole[]> = {
  dashboard: ALL,
  activities: ALL,
  workload: ALL,
  employees: ["OPERATION", "ADMIN", "CHAPTER", "TALENT"],
  entra: ["OPERATION", "ADMIN"],
  contracts: ["CHAPTER", "OPERATION", "ADMIN"],
  assignments: ["CHAPTER", "OPERATION", "TALENT", "ADMIN"],
  // Ditutup untuk semua peran selama modul ditunda (T032): rute `/idp` dan
  // `/evaluations/*` memakai `isModuleOpen`, tab "IDP Saya" di profil mengikuti
  // baris ini, dan server menolak modulnya. Aktivasi (T084) mengembalikannya ke
  // `ALL` bersamaan dengan `deferredModules` di backend.
  idp: [],
  evaluations: [],
  cv: ["TALENT", "CHAPTER", "OPERATION", "ADMIN"],
  masterData: ["CHAPTER", "OPERATION", "ADMIN"],
  accounts: ["ADMIN"],
  audit: ["ADMIN"],
};

const MANAGE_ROLES: Partial<Record<Module, readonly AccessRole[]>> = {
  employees: ["OPERATION", "ADMIN"],
  assignments: ["CHAPTER", "ADMIN"],
  contracts: ["OPERATION", "ADMIN"],
  masterData: ["ADMIN"],
};

export function canManage(role: AccessRole | null | undefined, module: Module): boolean {
  if (!role) return false;
  return (MANAGE_ROLES[module] ?? []).includes(role);
}

export function canAccess(role: AccessRole | null | undefined, module: Module): boolean {
  if (!role) return false;
  return MODULE_ROLES[module].includes(role);
}

export function isModuleOpen(module: Module): boolean {
  return MODULE_ROLES[module].length > 0;
}
