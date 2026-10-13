import type { AccessRole } from "@/generated/graphql";

/**
 * UI mirror of the role & module matrix (specs/002-tania-rbac/spec.md). A
 * module opens only for the roles it lists (deny-by-default, FR-03). TAN-178
 * re-opens IDP & Evaluation on this line to follow the feature/design baseline;
 * the backend remains the enforcement point (FR-15/16).
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
  idp: ["CHAPTER", "TALENT", "ADMIN"],
  evaluations: ["CHAPTER", "TALENT", "ADMIN"],
  cv: ["TALENT", "CHAPTER"],
  masterData: ["ADMIN"],
  accounts: ["ADMIN"],
  audit: ["ADMIN"],
};

const MANAGE_ROLES: Partial<Record<Module, readonly AccessRole[]>> = {
  employees: ["OPERATION"],
  assignments: ["CHAPTER"],
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
