import {
  IconChartBar,
  IconClipboardCheck,
  IconClipboardText,
  IconClock,
  IconClockHour3,
  IconDatabase,
  IconFileCv,
  IconLayoutGrid,
  IconTarget,
  IconUserShield,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import type { AccessRole } from "@/generated/graphql";

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

const ALL: readonly AccessRole[] = ["TALENT", "CHAPTER", "OPERATION", "ADMIN"];

/**
 * Single source of truth for the sidebar. Multi-page sections (Master Data,
 * Evaluations) are groups rendered as expandable submenus; the rest are direct
 * links. Visibility is role-scoped at the UI layer — the backend still enforces
 * authorization (FR-16).
 */
export const NAV: readonly NavEntry[] = [
  { kind: "link", href: "/dashboard", label: "Dashboard", icon: IconLayoutGrid, roles: ALL },
  { kind: "link", href: "/activities", label: "Aktivitas saya", icon: IconClockHour3, roles: ALL },
  { kind: "link", href: "/workload", label: "Workload", icon: IconChartBar, roles: ALL },
  { kind: "link", href: "/employees", label: "Employees", icon: IconUsers, roles: ["OPERATION", "ADMIN"] },
  { kind: "link", href: "/assignments", label: "Assignments", icon: IconClipboardText, roles: ["CHAPTER", "ADMIN"] },
  { kind: "link", href: "/idp", label: "IDP", icon: IconTarget, roles: ["CHAPTER", "TALENT", "ADMIN"] },
  { kind: "link", href: "/cv", label: "CV", icon: IconFileCv, roles: ["TALENT", "CHAPTER"] },
  {
    kind: "group",
    id: "evaluations",
    label: "Evaluations",
    icon: IconClipboardCheck,
    roles: ["CHAPTER", "TALENT", "ADMIN"],
    children: [
      { href: "/evaluations", label: "Roster", roles: ["CHAPTER", "ADMIN"] },
      { href: "/evaluations/periods", label: "Periode", roles: ["ADMIN"] },
      { href: "/evaluations/templates", label: "Template", roles: ["ADMIN"] },
      { href: "/evaluations/my", label: "Evaluasi Saya", roles: ["TALENT"] },
    ],
  },
  { kind: "link", href: "/accounts", label: "Accounts", icon: IconUserShield, roles: ["ADMIN"] },
  {
    kind: "group",
    id: "master-data",
    label: "Master Data",
    icon: IconDatabase,
    roles: ["ADMIN"],
    children: [
      { href: "/master-data/units", label: "Unit", roles: ["ADMIN"] },
      { href: "/master-data/chapters", label: "Chapter", roles: ["ADMIN"] },
      { href: "/master-data/job-roles", label: "Job Role", roles: ["ADMIN"] },
      { href: "/master-data/projects", label: "Project", roles: ["ADMIN"] },
    ],
  },
  { kind: "link", href: "/audit", label: "Audit", icon: IconClock, roles: ["ADMIN"] },
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