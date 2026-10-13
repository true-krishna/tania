import {
  IconChartBar,
  IconClock,
  IconClockHour3,
  IconDatabase,
  IconFileCv,
  IconLayoutGrid,
  IconUserPlus,
  IconUserShield,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import type { AccessRole } from "@/generated/graphql";
import { MODULE_ROLES } from "@/lib/auth/matrix";

export interface NavLink {
  href: string;
  label: string;
  roles: readonly AccessRole[];
}

export interface NavStandalone {
  kind: "link";
  href: string;
  label: string;
  icon: TablerIcon;
  roles: readonly AccessRole[];
}

export interface NavSubmenu {
  kind: "group";
  id: string;
  label: string;
  icon: TablerIcon;
  roles: readonly AccessRole[];
  /** Multi-page section, rendered as an expandable submenu in the sidebar. */
  children: readonly NavLink[];
}

export type NavEntry = NavStandalone | NavSubmenu;

/**
 * Single source of truth for the sidebar. Multi-page sections (Employee,
 * Master Data) are groups rendered as expandable submenus; the rest are direct
 * links. Visibility follows the role & module matrix (`@/lib/auth/matrix`);
 * deferred modules (IDP, Evaluation) have no entry. The backend still enforces
 * authorization (FR-15/16).
 */
export const NAV: readonly NavEntry[] = [
  { kind: "link", href: "/dashboard", label: "Dashboard", icon: IconLayoutGrid, roles: MODULE_ROLES.dashboard },
  { kind: "link", href: "/activities", label: "Aktivitas saya", icon: IconClockHour3, roles: MODULE_ROLES.activities },
  { kind: "link", href: "/workload", label: "Workload", icon: IconChartBar, roles: MODULE_ROLES.workload },
  {
    kind: "group",
    id: "employee",
    label: "Employee",
    icon: IconUsers,
    // The group shows whenever the role can reach at least one child, i.e. the
    // union of the children's matrix roles.
    roles: [...new Set([...MODULE_ROLES.employees, ...MODULE_ROLES.contracts, ...MODULE_ROLES.assignments])],
    children: [
      { href: "/employees", label: "Data Karyawan", roles: MODULE_ROLES.employees },
      { href: "/contracts", label: "Kontrak", roles: MODULE_ROLES.contracts },
      { href: "/assignments", label: "Assignments", roles: MODULE_ROLES.assignments },
    ],
  },
  { kind: "link", href: "/entra", label: "Provisi Entra", icon: IconUserPlus, roles: MODULE_ROLES.entra },
  { kind: "link", href: "/cv", label: "CV", icon: IconFileCv, roles: MODULE_ROLES.cv },
  { kind: "link", href: "/accounts", label: "Accounts", icon: IconUserShield, roles: MODULE_ROLES.accounts },
  {
    kind: "group",
    id: "master-data",
    label: "Master Data",
    icon: IconDatabase,
    roles: MODULE_ROLES.masterData,
    children: [
      { href: "/master-data/units", label: "Unit", roles: MODULE_ROLES.masterData },
      { href: "/master-data/chapters", label: "Chapter", roles: MODULE_ROLES.masterData },
      { href: "/master-data/job-roles", label: "Job Role", roles: MODULE_ROLES.masterData },
      { href: "/master-data/projects", label: "Project", roles: MODULE_ROLES.masterData },
    ],
  },
  { kind: "link", href: "/audit", label: "Audit", icon: IconClock, roles: MODULE_ROLES.audit },
];

/** Sidebar section label for the current route, shown in the top bar. */
export function sectionForPath(pathname: string): string {
  let bestLabel = "Tania";
  let bestLength = -1;
  for (const entry of NAV) {
    const hrefs = entry.kind === "link" ? [entry.href] : entry.children.map((c) => c.href);
    for (const href of hrefs) {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      if (active && href.length > bestLength) {
        bestLabel = entry.label;
        bestLength = href.length;
      }
    }
  }
  return bestLabel;
}
