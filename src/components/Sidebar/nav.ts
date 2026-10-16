import {
  IconChartBar,
  IconClipboardCheck,
  IconClock,
  IconClockHour3,
  IconDatabase,
  IconFileCv,
  IconLayoutGrid,
  IconTarget,
  IconUserPlus,
  IconUserShield,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import type { AccessRole } from "@/generated/graphql";
import {
  ACCOUNTS,
  ACTIVITIES,
  AUDIT,
  CONTRACTS,
  CV,
  DASHBOARD,
  EMPLOYEES,
  ENTRA,
  EVALUATIONS,
  EVALUATIONS_MY,
  EVALUATION_PERIODS,
  EVALUATION_TEMPLATES,
  IDP,
  MASTER_DATA_CHAPTERS,
  MASTER_DATA_JOB_ROLES,
  MASTER_DATA_PROJECTS,
  MASTER_DATA_UNITS,
  TALENT_ASSIGNMENT,
  WORKLOAD,
  WORKLOAD_EXECUTIVE,
  WORKLOAD_TALENT,
} from "@/lib/constants/routes";

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
 * Single source of truth for the sidebar. Multi-page sections (Employee,
 * Evaluations, Master Data) are groups rendered as expandable submenus; the
 * rest are direct links. Visibility is role-scoped at the UI layer — the
 * backend still enforces authorization (FR-16).
 *
 * R2.2 (002-tania-rbac): each entry mirrors the role/module matrix. Every
 * module a role may *read* has a menu entry, even when the page turns out
 * read-only for that role — Data Karyawan for Chapter (scoped) and Talent
 * (own record), Kontrak for Chapter (scoped, read-only), CV for Operation,
 * Assignments for Operation (read-only) and Talent (own history), Master Data
 * for Operation (read-only) and Chapter (scoped read).
 *
 * 2026-10-16 (clarify 5/6): Kontrak `+CHAPTER` (cakupan, hanya baca), CV
 * `+OPERATION` (hanya baca), Master Data = `[CHAPTER, OPERATION, ADMIN]`
 * (Talent tanpa akses).
 *
 * 2026-10-16 (clarify 9 — aktivasi): IDP & Evaluation tampil untuk **semua**
 * peran; yang berbeda hanya aksesnya. `/idp` terbuka bagi keempat peran (Talent
 * melihat IDP-nya sendiri, Operation hanya baca, Chapter/Admin mengelola) dan
 * grup Evaluations terbuka bagi keempat peran lewat anak yang sesuai — Roster
 * untuk Admin/Operation/Chapter, Periode & Template tetap Admin (konfigurasi
 * global), Evaluasi Saya untuk Talent. `nav.test.ts` menjaga invariannya: tidak
 * ada tautan mati, dan setiap peran yang boleh membuka modul melihat minimal
 * satu entri modul itu.
 */
export const NAV: readonly NavEntry[] = [
  { kind: "link", href: DASHBOARD, label: "Dashboard", icon: IconLayoutGrid, roles: ALL },
  { kind: "link", href: ACTIVITIES, label: "Aktivitas saya", icon: IconClockHour3, roles: ALL },
  /**
   * Umpan balik pemilik produk (TAN-227): level user memakai satu menu
   * Workload tanpa submenu; level executive memakai grup dengan dua submenu
   * — Overview dan Talent (tabel talent dengan workload).
   */
  { kind: "link", href: WORKLOAD, label: "Workload", icon: IconChartBar, roles: ["TALENT"] },
  {
    kind: "group",
    id: "workload",
    label: "Workload",
    icon: IconChartBar,
    roles: ["CHAPTER", "OPERATION", "ADMIN"],
    children: [
      { href: WORKLOAD_EXECUTIVE, label: "Overview", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: WORKLOAD_TALENT, label: "Talent", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
    ],
  },
  {
    kind: "group",
    id: "employee",
    label: "Employee",
    icon: IconUsers,
    roles: ALL,
    children: [
      { href: EMPLOYEES, label: "Data Karyawan", roles: ALL },
      { href: CONTRACTS, label: "Kontrak", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: TALENT_ASSIGNMENT, label: "Assignments", roles: ALL },
    ],
  },
  { kind: "link", href: ENTRA, label: "Provisi Entra", icon: IconUserPlus, roles: ["OPERATION", "ADMIN"] },
  { kind: "link", href: IDP, label: "IDP", icon: IconTarget, roles: ALL },
  { kind: "link", href: CV, label: "CV", icon: IconFileCv, roles: ALL },
  {
    kind: "group",
    id: "evaluations",
    label: "Evaluations",
    icon: IconClipboardCheck,
    roles: ALL,
    children: [
      { href: EVALUATIONS, label: "Roster", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: EVALUATION_PERIODS, label: "Periode", roles: ["ADMIN"] },
      { href: EVALUATION_TEMPLATES, label: "Template", roles: ["ADMIN"] },
      { href: EVALUATIONS_MY, label: "Evaluasi Saya", roles: ["TALENT"] },
    ],
  },
  { kind: "link", href: ACCOUNTS, label: "Accounts", icon: IconUserShield, roles: ["ADMIN"] },
  {
    kind: "group",
    id: "master-data",
    label: "Master Data",
    icon: IconDatabase,
    roles: ["CHAPTER", "OPERATION", "ADMIN"],
    children: [
      { href: MASTER_DATA_UNITS, label: "Unit", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: MASTER_DATA_CHAPTERS, label: "Chapter", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: MASTER_DATA_JOB_ROLES, label: "Job Role", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: MASTER_DATA_PROJECTS, label: "Project", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
    ],
  },
  { kind: "link", href: AUDIT, label: "Audit", icon: IconClock, roles: ["ADMIN"] },
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