import {
  IconClipboardCheck,
  IconClockHour3,
  IconDatabase,
  IconLayoutGrid,
  IconTarget,
  IconUserPlus,
  IconUserShield,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import type { AccessRole } from "@/generated/graphql";
import { menuEntryIdForHref, visibleByConfig, type MenuAccessConfig } from "@/lib/auth/menuAccess";
import {
  ACCOUNTS,
  ACTIVITIES,
  AUDIT,
  CONTRACTS,
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
  ROLES_ADMIN,
  TALENT_ASSIGNMENT,
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
 * (own record), Kontrak for Chapter (scoped, read-only), Assignments for
 * Operation (read-only), Master Data for Operation (read-only) and Chapter
 * (scoped read).
 *
 * 2026-10-29 (TAN-372): CV is no longer a menu — it lives inside the talent
 * profile (`/profile` for the caller's own CV, `/employees/[id]` read-only for
 * Chapter/Operation/Admin).
 *
 * 2026-10-29 (TAN-374, keputusan TAN-364): Admin kembali memegang Dashboard,
 * grup Employee (Data Karyawan, Kontrak, Assignments) dan Provisi Entra; menu
 * Workload dihapus seluruhnya — prototipenya masih fixture dan modulnya baru
 * diaktifkan lagi oleh TAN-378.
 *
 * 2026-10-16 (clarify 5/6): Kontrak `+CHAPTER` (cakupan, hanya baca), Master
 * Data = `[CHAPTER, OPERATION, ADMIN]` (Talent tanpa akses).
 *
 * 2026-10-16 (clarify 9 — aktivasi): IDP & Evaluation tampil untuk **semua**
 * peran; yang berbeda hanya aksesnya. `/idp` terbuka bagi keempat peran (Talent
 * melihat IDP-nya sendiri, Operation hanya baca, Chapter/Admin mengelola) dan
 * grup Evaluations terbuka bagi keempat peran lewat anak yang sesuai — Roster
 * untuk Admin/Operation/Chapter, Periode & Template tetap Admin (konfigurasi
 * global), Evaluasi Saya untuk Talent. `nav.test.ts` menjaga invariannya: tidak
 * ada tautan mati, dan setiap peran yang boleh membuka modul melihat minimal
 * satu entri modul itu.
 *
 * 2026-10-27 (TAN-343): sel default mengikuti definisi peran baru — Dashboard
 * hanya Operation & Chapter, Employee tanpa Admin, Assignments hanya
 * Chapter/Operation (Talent ditunda), Provisi Entra hanya Operation.
 * Bagian Dashboard/Employee/Entra dari amandemen ini dicabut TAN-374: Admin
 * mengelola seluruh modul operasional lagi.
 *
 * 2026-10-29 (TAN-376): Accounts, Menu & Akses (`/admin/roles`), dan Audit
 * dikelompokkan sebagai "Administration" supaya konfigurasi menu ditemukan
 * lewat navigasi, bukan hanya tautan di halaman Accounts.
 */
export const NAV: readonly NavEntry[] = [
  {
    kind: "link",
    href: DASHBOARD,
    label: "Dashboard",
    icon: IconLayoutGrid,
    roles: ["CHAPTER", "OPERATION", "ADMIN"],
  },
  { kind: "link", href: ACTIVITIES, label: "Aktivitas saya", icon: IconClockHour3, roles: ALL },
  {
    kind: "group",
    id: "employee",
    label: "Employee",
    icon: IconUsers,
    roles: ["TALENT", "CHAPTER", "OPERATION", "ADMIN"],
    children: [
      {
        href: EMPLOYEES,
        label: "Data Karyawan",
        roles: ["TALENT", "CHAPTER", "OPERATION", "ADMIN"],
      },
      { href: CONTRACTS, label: "Kontrak", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
      { href: TALENT_ASSIGNMENT, label: "Assignments", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
    ],
  },
  {
    kind: "link",
    href: ENTRA,
    label: "Provisi Entra",
    icon: IconUserPlus,
    roles: ["OPERATION", "ADMIN"],
  },
  { kind: "link", href: IDP, label: "IDP", icon: IconTarget, roles: ALL },
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
  {
    kind: "group",
    id: "administration",
    label: "Administration",
    icon: IconUserShield,
    roles: ["ADMIN"],
    children: [
      { href: ACCOUNTS, label: "Accounts", roles: ["ADMIN"] },
      { href: ROLES_ADMIN, label: "Menu & Akses", roles: ["ADMIN"] },
      { href: AUDIT, label: "Audit", roles: ["ADMIN"] },
    ],
  },
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
      // Submenu dilabeli "Initiative" (keputusan produk, D5 004-master-data-create);
      // entitas & rutenya tetap Project.
      { href: MASTER_DATA_PROJECTS, label: "Initiative", roles: ["CHAPTER", "OPERATION", "ADMIN"] },
    ],
  },
];

/**
 * Entries a role sees under the active configuration, in sidebar order.
 *
 * A group survives only while it has a visible child, so an Admin who hides
 * every page of a section hides the section too. With no configuration (still
 * loading, or a session the server has not answered for yet) the caller keeps
 * the static `roles` filter of `NAV`, which is today's behaviour — the sidebar
 * never flickers empty while the configuration is in flight.
 *
 * The server is the enforcement point (US-C): this only decides what is drawn,
 * and `nav.test.ts` asserts that nothing drawn is denied by the active config.
 */
export function visibleNavEntries(
  config: MenuAccessConfig | null,
  roleName: string | null,
): readonly NavEntry[] {
  if (!config || !roleName) return NAV;
  const entries: NavEntry[] = [];
  for (const entry of NAV) {
    if (entry.kind === "link") {
      if (visibleByConfig(config, roleName, menuEntryIdForHref(entry.href))) entries.push(entry);
      continue;
    }
    const children = entry.children.filter((child) =>
      visibleByConfig(config, roleName, menuEntryIdForHref(child.href)),
    );
    if (children.length > 0) entries.push({ ...entry, children });
  }
  return entries;
}

/** Sidebar section label for the current route, shown in the top bar. */
export function sectionForPath(pathname: string): string {
  if (pathname === ROLES_ADMIN || pathname.startsWith(`${ROLES_ADMIN}/`)) {
    return "Menu & Akses";
  }
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
