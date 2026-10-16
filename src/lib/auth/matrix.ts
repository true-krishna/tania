import type { AccessRole } from "@/generated/graphql";

/**
 * UI mirror of the role & module matrix (specs/002-tania-rbac/spec.md). A
 * module opens only for the roles it lists (deny-by-default, FR-03). TAN-178
 * re-opens IDP & Evaluation on this line to follow the feature/design baseline;
 * the backend remains the enforcement point (FR-15/16). TAN-212 (clarify 4)
 * gives Admin full manage on every active module; the 2026-10-15 pass hides the
 * deferred IDP/Evaluation entries in the sidebar (matrix: denied for everyone)
 * while their matrix rows/routes stay on the TAN-178 baseline (open item T032).
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
  contracts: ["OPERATION", "ADMIN"],
  assignments: ["CHAPTER", "OPERATION", "TALENT", "ADMIN"],
  idp: ["CHAPTER", "TALENT", "ADMIN"],
  evaluations: ["CHAPTER", "TALENT", "ADMIN"],
  cv: ["TALENT", "CHAPTER", "ADMIN"],
  masterData: ALL,
  accounts: ["ADMIN"],
  audit: ["ADMIN"],
};

const MANAGE_ROLES: Partial<Record<Module, readonly AccessRole[]>> = {
  employees: ["OPERATION", "ADMIN"],
  assignments: ["CHAPTER", "ADMIN"],
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
