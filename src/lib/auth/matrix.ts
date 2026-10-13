import type { AccessRole } from "@/generated/graphql";

/**
 * UI mirror of the role & module matrix (specs/002-tania-rbac/spec.md). A
 * module opens only for the roles it lists (deny-by-default, FR-03); deferred
 * modules (IDP, Evaluation incl. periods & templates) list no role. The
 * backend remains the enforcement point (FR-15/16).
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
  entra: ["OPERATION"],
  contracts: ["OPERATION", "ADMIN"],
  assignments: ["CHAPTER", "OPERATION", "TALENT"],
  idp: [],
  evaluations: [],
  cv: ["TALENT", "CHAPTER"],
  masterData: ["ADMIN"],
  accounts: ["ADMIN"],
  audit: ["ADMIN"],
};

export function canAccess(role: AccessRole | null | undefined, module: Module): boolean {
  if (!role) return false;
  return MODULE_ROLES[module].includes(role);
}

export function isModuleOpen(module: Module): boolean {
  return MODULE_ROLES[module].length > 0;
}
