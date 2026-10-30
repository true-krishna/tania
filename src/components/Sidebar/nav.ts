import {
  IconBriefcase,
  IconChartBar,
  IconClipboardCheck,
  IconClockHour3,
  IconDatabase,
  IconFileCv,
  IconLayoutGrid,
  IconTarget,
  IconUserCircle,
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
  ASSIGNMENT_MY,
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
  IDP_MY,
  MASTER_DATA_CHAPTERS,
  MASTER_DATA_JOB_ROLES,
  MASTER_DATA_PROJECTS,
  MASTER_DATA_UNITS,
  PROFILE,
  ROLES_ADMIN,
  TALENT_ASSIGNMENT,
  WORKLOAD,
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

const OPS: readonly AccessRole[] = ["CHAPTER", "OPERATION", "ADMIN"];

/**
 * Sidebar peran operasional (Chapter/Operation/Admin) — satu sumber kebenaran
 * untuk grup yang bisa dikonfigurasi Admin di Menu & Akses. Multi-page sections
 * (Karyawan, Evaluasi, Master Data) dirender sebagai submenu; sisanya tautan
 * langsung. Visibilitas diatur konfigurasi menu × role (W2/US-C); server tetap
 * titik penegakan (FR-16).
 *
 * R2.2 (002-tania-rbac): setiap entri mencerminkan matriks role/modul. Setiap
 * modul yang boleh *dibaca* sebuah peran punya entri menu, walau halamannya
 * hanya baca untuk peran itu.
 *
 * 2026-10-29 (TAN-372): CV bukan lagi menu operasional — CV karyawan dibaca
 * dari detail karyawan.
 *
 * 2026-10-29 (TAN-374, keputusan TAN-364): Admin kembali memegang Dashboard,
 * grup Karyawan (Data Karyawan, Kontrak, Assignments) dan Provisi Entra; menu
 * Workload dihapus — prototipenya masih fixture dan modulnya baru diaktifkan
 * lagi oleh TAN-378.
 *
 * 2026-10-16 (clarify 5/6): Kontrak `+CHAPTER` (cakupan, hanya baca), Master
 * Data = `[CHAPTER, OPERATION, ADMIN]`.
 *
 * 2026-10-16 (clarify 9 — aktivasi): IDP & Evaluation tampil untuk peran
 * operasional; `/idp` terbuka bagi Chapter/Operation/Admin (Operation hanya
 * baca, Chapter/Admin mengelola) dan grup Evaluasi berisi Roster (Chapter/
 * Operation/Admin) serta Periode & Template (Admin).
 *
 * 2026-10-27 (TAN-343): sel default mengikuti definisi peran baru — Dashboard
 * hanya Operation & Chapter, Employee tanpa Admin, Assignments hanya
 * Chapter/Operation. Bagian Dashboard/Employee/Entra dari amandemen ini dicabut
 * TAN-374: Admin mengelola seluruh modul operasional lagi.
 *
 * 2026-10-29 (TAN-376): Accounts, Menu & Akses (`/admin/roles`), dan Audit
 * dikelompokkan sebagai "Administrasi".
 *
 * 2026-10-30 (TAN-392): Talent keluar dari menu operasional ini dan memakai
 * `TALENT_NAV` — halaman pribadi yang datar, tanpa grup. Halaman pribadi tidak
 * masuk katalog menu server (katalognya hanya memuat permukaan operasional),
 * jadi tidak ikut dikonfigurasi di Menu & Akses.
 */
export const NAV: readonly NavEntry[] = [
  {
    kind: "link",
    href: DASHBOARD,
    label: "Dashboard",
    icon: IconLayoutGrid,
    roles: ["CHAPTER", "OPERATION", "ADMIN"],
  },
  { kind: "link", href: ACTIVITIES, label: "Aktivitas saya", icon: IconClockHour3, roles: OPS },
  {
    kind: "group",
    id: "employee",
    label: "Karyawan",
    icon: IconUsers,
    roles: OPS,
    children: [
      { href: EMPLOYEES, label: "Data Karyawan", roles: OPS },
      { href: CONTRACTS, label: "Kontrak", roles: OPS },
      { href: TALENT_ASSIGNMENT, label: "Assignments", roles: OPS },
    ],
  },
  {
    kind: "link",
    href: ENTRA,
    label: "Provisi Entra",
    icon: IconUserPlus,
    roles: ["OPERATION", "ADMIN"],
  },
  { kind: "link", href: IDP, label: "IDP", icon: IconTarget, roles: OPS },
  {
    kind: "group",
    id: "evaluations",
    label: "Evaluasi",
    icon: IconClipboardCheck,
    roles: OPS,
    children: [
      { href: EVALUATIONS, label: "Roster", roles: OPS },
      { href: EVALUATION_PERIODS, label: "Periode", roles: ["ADMIN"] },
      { href: EVALUATION_TEMPLATES, label: "Template", roles: ["ADMIN"] },
    ],
  },
  {
    kind: "group",
    id: "administration",
    label: "Administrasi",
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
 * Sidebar datar peran Talent (TAN-392): setiap entri adalah halaman milik
 * pemanggil sendiri, diurutkan menurut frekuensi kerja (identitas → beban →
 * log harian → pertumbuhan). Tidak ada grup karena setiap grup operasional
 * hanya menyisakan satu anak untuk Talent.
 *
 * Label halaman pribadi tanpa "saya" (keputusan pemilik produk, 2026-10-30) —
 * cakupan halaman sudah jelas dari posisinya di sidebar Talent. "Assignment"
 * membaca riwayat assignment dari profil CV mandiri sampai TAN-393 menyediakan
 * baca assignment khusus.
 */
export const TALENT_NAV: readonly NavEntry[] = [
  { kind: "link", href: PROFILE, label: "Profil", icon: IconUserCircle, roles: ["TALENT"] },
  {
    kind: "link",
    href: ASSIGNMENT_MY,
    label: "Assignment",
    icon: IconBriefcase,
    roles: ["TALENT"],
  },
  { kind: "link", href: WORKLOAD, label: "Workload", icon: IconChartBar, roles: ["TALENT"] },
  {
    kind: "link",
    href: ACTIVITIES,
    label: "Aktivitas",
    icon: IconClockHour3,
    roles: ["TALENT"],
  },
  { kind: "link", href: CV, label: "CV", icon: IconFileCv, roles: ["TALENT"] },
  { kind: "link", href: IDP_MY, label: "IDP", icon: IconTarget, roles: ["TALENT"] },
  {
    kind: "link",
    href: EVALUATIONS_MY,
    label: "Evaluasi",
    icon: IconClipboardCheck,
    roles: ["TALENT"],
  },
];

/**
 * A group with one visible child renders as that child, using the group's icon:
 * "Evaluasi → Roster" for Operation and Chapter is a group that repeats its
 * child, not a section worth an expand affordance.
 */
function collapseSingleChildGroups(entries: readonly NavEntry[]): NavEntry[] {
  return entries.map((entry) => {
    if (entry.kind === "link" || entry.children.length !== 1) return entry;
    const child = entry.children[0];
    return {
      kind: "link",
      href: child.href,
      label: child.label,
      icon: entry.icon,
      roles: child.roles,
    };
  });
}

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
 *
 * The Talent template role draws `TALENT_NAV` as-is (TAN-392): its pages are
 * self-scoped and absent from the server menu catalog, so there is no cell to
 * read. Custom roles with Talent as their template role follow the same list.
 */
export function visibleNavEntries(
  config: MenuAccessConfig | null,
  roleName: string | null,
  templateRole: AccessRole | null = null,
): readonly NavEntry[] {
  if (templateRole === "TALENT") return TALENT_NAV;
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
  return collapseSingleChildGroups(entries);
}

/** The static role filter of `NAV`, with one-child groups collapsed to their child. */
export function navEntriesForRole(role: AccessRole | null): readonly NavEntry[] {
  if (role === "TALENT") return TALENT_NAV;
  const entries: NavEntry[] = [];
  for (const entry of NAV) {
    if (entry.kind === "link") {
      if (!role || entry.roles.includes(role)) entries.push(entry);
      continue;
    }
    const children = entry.children.filter((child) => !role || child.roles.includes(role));
    if (children.length > 0) entries.push({ ...entry, children });
  }
  return collapseSingleChildGroups(entries);
}

/** Sidebar section label for the current route, shown in the top bar. */
export function sectionForPath(pathname: string): string {
  if (pathname === ROLES_ADMIN || pathname.startsWith(`${ROLES_ADMIN}/`)) {
    return "Menu & Akses";
  }
  let bestLabel = "Tania";
  let bestLength = -1;
  for (const entry of [...NAV, ...TALENT_NAV]) {
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
