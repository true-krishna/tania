import type { AccessRole } from "@/generated/graphql";
import type { Module } from "./matrix";

/**
 * Frontend mirror of the server's menu × role configuration (W1/W2,
 * 002-tania-rbac US-C). The server is the enforcement point: `access_level` is
 * the authorization axis (NONE denies, READ allows reads, MANAGE allows reads
 * and management) and a closed entry is refused with FORBIDDEN. `visible` is a
 * sidebar-only hint and never widens or closes server authorization.
 *
 * The default matrix below reproduces the 002 baseline exactly — it is the same
 * table the server seeds/falls back to (`internal/domain/roleconfig.go`,
 * `defaultMenuAccess`), keyed by the menu entry id that `role_menu_config`
 * stores. `nav.test.ts` uses it to assert that no menu shows a module the
 * server denies on the active configuration.
 */
export type MenuAccessLevel = "NONE" | "READ" | "MANAGE";

export interface MenuAccessCell {
  /** Sidebar visibility — a UI hint only. */
  visible: boolean;
  accessLevel: MenuAccessLevel;
}

/** Role name → menu entry id → cell. Role names match the server's `roles.name`. */
export type MenuAccessConfig = Record<string, Record<string, MenuAccessCell>>;

export const ACCESS_ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

/**
 * Menu entry id of a NAV route: the route path without its leading slash. It is
 * identical to `role_menu_config.menu_entry_id` (W1) and to the `MenuDashboard`
 * style constants of the server, so backend, database, and sidebar share one
 * naming scheme.
 */
export function menuEntryIdForHref(href: string): string {
  return href.replace(/^\//, "");
}

/**
 * Sidebar href → matrix module. Promoted from `nav.test.ts` so the sidebar and
 * the invariant tests read the same registry.
 */
export const MODULE_OF_HREF: Record<string, Module> = {
  "/dashboard": "dashboard",
  "/activities": "activities",
  "/workload": "workload",
  "/workload/executive": "workload",
  "/workload/talent": "workload",
  "/employees": "employees",
  "/contracts": "contracts",
  "/assignments": "assignments",
  "/entra": "entra",
  "/idp": "idp",
  "/cv": "cv",
  "/evaluations": "evaluations",
  "/evaluations/periods": "evaluations",
  "/evaluations/templates": "evaluations",
  "/evaluations/my": "evaluations",
  "/master-data/units": "masterData",
  "/master-data/chapters": "masterData",
  "/master-data/job-roles": "masterData",
  "/master-data/projects": "masterData",
  "/accounts": "accounts",
  "/audit": "audit",
};

function buildDefaultMenuAccess(): MenuAccessConfig {
  const matrix: Record<string, Partial<Record<AccessRole, MenuAccessLevel>>> = {};
  const set = (entry: string, level: MenuAccessLevel, roles: readonly AccessRole[]) => {
    matrix[entry] = matrix[entry] ?? {};
    for (const role of roles) matrix[entry][role] = level;
  };
  const all: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];
  const execs: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER"];

  // TAN-343: dashboard hanya Operation & Chapter (sel default).
  set("dashboard", "READ", ["OPERATION", "CHAPTER"]);
  set("activities", "READ", all);
  // Talent gets the single Workload link; the other roles get the group pages.
  set("workload", "READ", ["TALENT"]);
  set("workload/executive", "READ", execs);
  set("workload/talent", "READ", execs);
  // TAN-343: Admin memegang tanpa sel pada employees/contracts/assignments/
  // entra; Talent tanpa Assignment (fitur self-service ditunda).
  set("employees", "MANAGE", ["OPERATION"]);
  set("employees", "READ", ["CHAPTER", "TALENT"]);
  set("contracts", "MANAGE", ["OPERATION"]);
  set("contracts", "READ", ["CHAPTER"]);
  set("assignments", "MANAGE", ["CHAPTER"]);
  set("assignments", "READ", ["OPERATION"]);
  set("entra", "MANAGE", ["OPERATION"]);
  // IDP: Chapter manages its scope, Talent its own record, Operation reads.
  set("idp", "MANAGE", ["ADMIN", "CHAPTER", "TALENT"]);
  set("idp", "READ", ["OPERATION"]);
  set("cv", "MANAGE", ["TALENT"]);
  set("cv", "READ", ["ADMIN", "OPERATION", "CHAPTER"]);
  set("evaluations", "MANAGE", ["ADMIN", "CHAPTER"]);
  set("evaluations", "READ", ["OPERATION"]);
  set("evaluations/periods", "MANAGE", ["ADMIN"]);
  set("evaluations/templates", "MANAGE", ["ADMIN"]);
  set("evaluations/my", "MANAGE", ["TALENT"]);
  set("accounts", "MANAGE", ["ADMIN"]);
  for (const entry of [
    "master-data/units",
    "master-data/chapters",
    "master-data/job-roles",
    "master-data/projects",
  ]) {
    set(entry, "MANAGE", ["ADMIN"]);
    set(entry, "READ", ["CHAPTER", "OPERATION"]);
  }
  set("audit", "READ", ["ADMIN"]);

  const config: MenuAccessConfig = {};
  for (const [entry, roles] of Object.entries(matrix)) {
    for (const [role, level] of Object.entries(roles)) {
      config[role] = config[role] ?? {};
      config[role][entry] = { visible: true, accessLevel: level as MenuAccessLevel };
    }
  }
  return config;
}

/** The 002 baseline configuration, identical to the server's fallback matrix. */
export const DEFAULT_MENU_ACCESS: MenuAccessConfig = buildDefaultMenuAccess();

/** Configured level of one cell; an absent row is NONE (deny by default). */
export function accessLevel(config: MenuAccessConfig, role: string, entry: string): MenuAccessLevel {
  return config[role]?.[entry]?.accessLevel ?? "NONE";
}

/** Whether the server would allow an operation needing `required` on `entry`. */
export function serverAllows(
  config: MenuAccessConfig,
  role: string,
  entry: string,
  required: "READ" | "MANAGE"
): boolean {
  const level = accessLevel(config, role, entry);
  return required === "READ" ? level === "READ" || level === "MANAGE" : level === "MANAGE";
}

/**
 * Whether the sidebar may show one entry for a role: hidden when the admin
 * hid it (`visible=false`) or when the server denies it (`access_level=NONE`),
 * so a menu can never offer a module the server refuses.
 */
export function visibleByConfig(config: MenuAccessConfig, role: string, entry: string): boolean {
  const cell = config[role]?.[entry];
  return !!cell && cell.visible && cell.accessLevel !== "NONE";
}
