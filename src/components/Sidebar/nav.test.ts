import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/generated/graphql";
import { canAccess, MODULE_ROLES, type Module } from "@/lib/auth/matrix";
import {
  ACCESS_ROLES,
  DEFAULT_MENU_ACCESS,
  MODULE_OF_HREF,
  type MenuAccessConfig,
  type MenuAccessLevel,
  accessLevel,
  menuEntryIdForHref,
  serverAllows,
  visibleByConfig,
} from "@/lib/auth/menuAccess";
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
import { NAV, sectionForPath, visibleNavEntries } from "./nav";

const ROLES: readonly AccessRole[] = ACCESS_ROLES;

interface Leaf {
  href: string;
  label: string;
  roles: readonly AccessRole[];
}

const LEAVES: Leaf[] = NAV.flatMap((entry) =>
  entry.kind === "link"
    ? [{ href: entry.href, label: entry.label, roles: entry.roles }]
    : entry.children.map((child) => ({ href: child.href, label: child.label, roles: child.roles })),
);

/**
 * Approved persona menu (TAN-364 decisions 2–4, landed by TAN-374). Admin is a
 * full-access role again; Workload is hidden until TAN-378 and appears for no
 * persona; Talent keeps only its own-record surfaces.
 */
const APPROVED_MENU: Record<AccessRole, readonly string[]> = {
  ADMIN: [
    DASHBOARD,
    ACTIVITIES,
    EMPLOYEES,
    CONTRACTS,
    TALENT_ASSIGNMENT,
    ENTRA,
    IDP,
    EVALUATIONS,
    EVALUATION_PERIODS,
    EVALUATION_TEMPLATES,
    ACCOUNTS,
    ROLES_ADMIN,
    AUDIT,
    MASTER_DATA_UNITS,
    MASTER_DATA_CHAPTERS,
    MASTER_DATA_JOB_ROLES,
    MASTER_DATA_PROJECTS,
  ],
  OPERATION: [
    DASHBOARD,
    ACTIVITIES,
    EMPLOYEES,
    CONTRACTS,
    TALENT_ASSIGNMENT,
    ENTRA,
    IDP,
    EVALUATIONS,
    MASTER_DATA_UNITS,
    MASTER_DATA_CHAPTERS,
    MASTER_DATA_JOB_ROLES,
    MASTER_DATA_PROJECTS,
  ],
  CHAPTER: [
    DASHBOARD,
    ACTIVITIES,
    EMPLOYEES,
    CONTRACTS,
    TALENT_ASSIGNMENT,
    IDP,
    EVALUATIONS,
    MASTER_DATA_UNITS,
    MASTER_DATA_CHAPTERS,
    MASTER_DATA_JOB_ROLES,
    MASTER_DATA_PROJECTS,
  ],
  TALENT: [ACTIVITIES, EMPLOYEES, IDP, EVALUATIONS_MY],
};

/** One configuration with a single cell overridden, for the non-default case. */
function withCell(
  config: MenuAccessConfig,
  role: string,
  entry: string,
  level: MenuAccessLevel,
  visible = true,
): MenuAccessConfig {
  return {
    ...config,
    [role]: { ...config[role], [entry]: { visible, accessLevel: level } },
  };
}

describe("NAV mirrors the role & module matrix (R2.2)", () => {
  it("tidak punya entri menu CV untuk peran mana pun (TAN-372)", () => {
    expect(LEAVES.some((leaf) => leaf.label === "CV")).toBe(false);
  });

  for (const leaf of LEAVES) {
    it(`${leaf.href} punya modul matriks`, () => {
      expect(MODULE_OF_HREF[leaf.href], `${leaf.href} tidak dipetakan ke modul`).toBeDefined();
    });
  }

  it("setiap peran yang boleh membuka modul melihat minimal satu entri modul itu", () => {
    for (const mod of Object.keys(MODULE_ROLES) as Module[]) {
      const leaves = LEAVES.filter((leaf) => MODULE_OF_HREF[leaf.href] === mod);
      expect(leaves.length, `modul ${mod} tidak punya entri sidebar`).toBeGreaterThan(0);
      for (const role of ROLES) {
        if (!canAccess(role, mod)) continue;
        const visible = leaves.filter((leaf) => leaf.roles.includes(role));
        expect(
          visible.length,
          `${role} boleh membuka ${mod} tetapi tidak melihat entri apa pun`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("menyembunyikan grup bila tidak ada anak yang tampil untuk peran itu", () => {
    for (const entry of NAV) {
      if (entry.kind === "link") continue;
      for (const role of ROLES) {
        const children = entry.children.filter((child) => child.roles.includes(role));
        if (children.length === 0) {
          expect(entry.roles.includes(role)).toBe(false);
        }
      }
    }
  });

  it("Menu & Akses hanya ada di grup Administration milik Admin (TAN-376)", () => {
    const administration = NAV.find(
      (entry) => entry.kind === "group" && entry.id === "administration",
    );
    expect(administration?.kind).toBe("group");
    if (administration?.kind !== "group") return;
    expect(administration.label).toBe("Administration");
    expect(administration.roles).toEqual(["ADMIN"]);
    expect(administration.children.map((child) => child.href)).toEqual([
      ACCOUNTS,
      ROLES_ADMIN,
      AUDIT,
    ]);
    for (const child of administration.children) {
      expect(child.roles).toEqual(["ADMIN"]);
    }
    for (const role of ["OPERATION", "CHAPTER", "TALENT"] as AccessRole[]) {
      expect(LEAVES.filter((leaf) => leaf.roles.includes(role))).not.toContainEqual(
        expect.objectContaining({ href: ROLES_ADMIN }),
      );
    }
  });

  it("menandai seksi aktif dari submenu terdalam", () => {
    expect(sectionForPath("/employees/emp-1")).toBe("Employee");
    expect(sectionForPath("/assignments")).toBe("Employee");
    expect(sectionForPath("/master-data/units")).toBe("Master Data");
    expect(sectionForPath("/accounts")).toBe("Administration");
    expect(sectionForPath("/admin/roles")).toBe("Menu & Akses");
  });
});

/**
 * R2.2 (W2, US-C) — the sidebar never offers a module the server denies on the
 * active configuration. The invariant is no longer "nav ≡ canAccess" of the
 * static FE matrix: visibility is derived from the active configuration
 * (`access_level` is the server authorization axis, `visible` a sidebar-only
 * hint), and each visible leaf must be allowed by the server gate for that
 * role. Checked against the default configuration (identical to the W1 seed /
 * 002 baseline) and against a non-default one.
 */
describe("sidebar mengikuti konfigurasi menu aktif (W3)", () => {
  /** Sidebar hrefs, flattened — the grid must equal this set, id for id. */
  const NAV_ENTRY_IDS = NAV.flatMap((entry) =>
    entry.kind === "link" ? [entry.href] : entry.children.map((child) => child.href),
  );

  /** Flattened hrefs a sidebar render shows, in order. */
  function drawnHrefs(config: MenuAccessConfig | null, roleName: string | null) {
    return visibleNavEntries(config, roleName).flatMap((entry) =>
      entry.kind === "link" ? [entry.href] : entry.children.map((child) => child.href),
    );
  }

  /** The static role filter a caller falls back to with no configuration. */
  function staticHrefs(role: AccessRole) {
    return NAV.flatMap((entry) => {
      if (!entry.roles.includes(role)) return [];
      if (entry.kind === "link") return [entry.href];
      return entry.children
        .filter((child) => child.roles.includes(role))
        .map((child) => child.href);
    });
  }

  it("tabel persona mengunci sidebar keempat peran", () => {
    for (const role of ROLES) {
      expect(drawnHrefs(DEFAULT_MENU_ACCESS, role), `konfigurasi default × ${role}`).toEqual(
        APPROVED_MENU[role],
      );
      expect(staticHrefs(role), `filter role statis × ${role}`).toEqual(APPROVED_MENU[role]);
    }
  });

  it("setiap menu yang tampil punya halaman untuk peran itu", () => {
    for (const role of ROLES) {
      for (const href of APPROVED_MENU[role]) {
        const page = path.join(process.cwd(), "src/app/(app)", href, "page.tsx");
        expect(existsSync(page), `${role} melihat ${href} tetapi halamannya tidak ada`).toBe(true);
      }
    }
  });

  it("Workload tidak muncul untuk peran mana pun (TAN-364 keputusan 4)", () => {
    expect(LEAVES.some((leaf) => leaf.label === "Workload")).toBe(false);
    for (const role of ROLES) {
      expect(
        drawnHrefs(DEFAULT_MENU_ACCESS, role).some((href) => href.startsWith("/workload")),
      ).toBe(false);
    }
  });

  it("tanpa konfigurasi sidebar tetap memakai filter role statis NAV", () => {
    // `visibleNavEntries` imposes no filter of its own when there is nothing to
    // read: it hands NAV back whole and `Sidebar` keeps applying the static role
    // lists (asserted in Sidebar.config.test.tsx).
    for (const role of ROLES) {
      expect(drawnHrefs(null, role)).toEqual(NAV_ENTRY_IDS);
    }
    expect(visibleNavEntries(null, "ADMIN")).toBe(NAV);
    expect(visibleNavEntries(DEFAULT_MENU_ACCESS, null)).toBe(NAV);
  });

  it("konfigurasi default menghasilkan menu yang identik dengan baseline 002", () => {
    // The precondition of the whole feature: an untouched `role_menu_config`
    // changes nothing on screen, for every role.
    for (const role of ROLES) {
      expect(drawnHrefs(DEFAULT_MENU_ACCESS, role), `role ${role}`).toEqual(staticHrefs(role));
    }
  });

  it("entri yang ditutup hilang dari sidebar, role lain tidak terpengaruh", () => {
    const closed = withCell(DEFAULT_MENU_ACCESS, "TALENT", "idp", "NONE");
    expect(drawnHrefs(closed, "TALENT")).not.toContain(IDP);
    expect(drawnHrefs(closed, "CHAPTER")).toContain(IDP);
  });

  it("grup tanpa anak yang tampil ikut hilang", () => {
    let config: MenuAccessConfig = DEFAULT_MENU_ACCESS;
    for (const entry of [
      "evaluations",
      "evaluations/periods",
      "evaluations/templates",
      "evaluations/my",
    ]) {
      config = withCell(config, "ADMIN", entry, "NONE");
    }
    const drawn = visibleNavEntries(config, "ADMIN");
    expect(drawn.some((entry) => entry.kind === "group" && entry.id === "evaluations")).toBe(false);
    // Only that group: the rest of the Admin menu is untouched.
    const administration = drawn.find(
      (entry) => entry.kind === "group" && entry.id === "administration",
    );
    expect(
      administration?.kind === "group" && administration.children.map((c) => c.href),
    ).toContain(ACCOUNTS);
  });

  it("role kustom memakai konfigurasi miliknya, bukan daftar role statis", () => {
    // `PM_CHAPTER` is not in any NAV `roles` list, so the static filter would draw
    // an empty sidebar; its configuration (template CHAPTER + overrides) is what
    // makes the menu appear without a code change.
    expect(staticHrefs("CHAPTER").length).toBeGreaterThan(0);
    const custom: MenuAccessConfig = { PM_CHAPTER: DEFAULT_MENU_ACCESS["CHAPTER"] };
    expect(drawnHrefs(custom, "PM_CHAPTER")).toEqual(staticHrefs("CHAPTER"));
    // And an unknown role draws nothing rather than everything: absence of a
    // configuration is never a reason to show a menu the server may deny.
    expect(drawnHrefs(DEFAULT_MENU_ACCESS, "PM_CHAPTER")).toEqual([]);
  });

  it("tidak ada entri yang digambar ketika konfigurasi aktif menolaknya", () => {
    const closed = withCell(DEFAULT_MENU_ACCESS, "CHAPTER", "employees", "NONE");
    for (const href of [...drawnHrefs(closed, "CHAPTER"), ...drawnHrefs(closed, "TALENT")]) {
      const role = drawnHrefs(closed, "CHAPTER").includes(href) ? "CHAPTER" : "TALENT";
      expect(serverAllows(closed, role, menuEntryIdForHref(href), "READ")).toBe(true);
    }
  });
});

describe("NAV tidak menampilkan modul yang ditolak server pada konfigurasi aktif", () => {
  it("konfigurasi default: setiap leaf yang tampil diizinkan server", () => {
    for (const leaf of LEAVES) {
      const entry = menuEntryIdForHref(leaf.href);
      for (const role of ROLES) {
        if (!leaf.roles.includes(role)) continue;
        expect(
          serverAllows(DEFAULT_MENU_ACCESS, role, entry, "READ"),
          `${leaf.label} × ${role}: menu tampil tetapi server menolak entry ${entry}`,
        ).toBe(true);
      }
    }
  });

  it("konfigurasi default: sumber visibilitas konfigurasi tidak pernah menampilkan entri yang ditolak", () => {
    for (const leaf of LEAVES) {
      const entry = menuEntryIdForHref(leaf.href);
      for (const role of ROLES) {
        if (!visibleByConfig(DEFAULT_MENU_ACCESS, role, entry)) continue;
        expect(serverAllows(DEFAULT_MENU_ACCESS, role, entry, "READ")).toBe(true);
      }
    }
    // The default matrix grants every NAV leaf its role exactly as before.
    for (const leaf of LEAVES) {
      const entry = menuEntryIdForHref(leaf.href);
      for (const role of ROLES) {
        expect(visibleByConfig(DEFAULT_MENU_ACCESS, role, entry)).toBe(leaf.roles.includes(role));
      }
    }
  });

  it("konfigurasi non-default: entri yang ditutup hilang dari menu", () => {
    const closed = withCell(DEFAULT_MENU_ACCESS, "TALENT", "idp", "NONE");
    expect(serverAllows(closed, "TALENT", "idp", "READ")).toBe(false);
    expect(visibleByConfig(closed, "TALENT", "idp")).toBe(false);
    // The other roles keep their default access — closing one cell is surgical.
    expect(serverAllows(closed, "CHAPTER", "idp", "MANAGE")).toBe(true);

    const opened = withCell(DEFAULT_MENU_ACCESS, "TALENT", "evaluations", "READ");
    expect(visibleByConfig(opened, "TALENT", "evaluations")).toBe(true);
    expect(serverAllows(opened, "TALENT", "evaluations", "READ")).toBe(true);
    expect(serverAllows(opened, "TALENT", "evaluations", "MANAGE")).toBe(false);

    for (const config of [closed, opened]) {
      for (const leaf of LEAVES) {
        const entry = menuEntryIdForHref(leaf.href);
        for (const role of ROLES) {
          if (!visibleByConfig(config, role, entry)) continue;
          expect(serverAllows(config, role, entry, "READ")).toBe(true);
        }
      }
    }
  });

  it("visible hanya tampilan: mengubahnya tidak mengubah otorisasi server", () => {
    const hidden = withCell(DEFAULT_MENU_ACCESS, "OPERATION", "idp", "READ", false);
    expect(visibleByConfig(hidden, "OPERATION", "idp")).toBe(false);
    expect(serverAllows(hidden, "OPERATION", "idp", "READ")).toBe(true);
    expect(accessLevel(hidden, "OPERATION", "idp")).toBe("READ");
  });

  it("konfigurasi default identik matriks default per entry (TAN-374)", () => {
    // Every entry of the sidebar registry carries the same level the server's
    // fallback matrix gives, so an empty `role_menu_config` changes nothing.
    // TAN-374: Admin memegang Dashboard/Employee/Entra lagi, Workload keluar
    // dari katalog, assignments tanpa Talent.
    const expected: Record<string, Record<string, MenuAccessLevel>> = {
      dashboard: { ADMIN: "READ", OPERATION: "READ", CHAPTER: "READ" },
      activities: { ADMIN: "READ", OPERATION: "READ", CHAPTER: "READ", TALENT: "READ" },
      employees: { ADMIN: "MANAGE", OPERATION: "MANAGE", CHAPTER: "READ", TALENT: "READ" },
      contracts: { ADMIN: "MANAGE", OPERATION: "MANAGE", CHAPTER: "READ" },
      assignments: { ADMIN: "MANAGE", CHAPTER: "MANAGE", OPERATION: "READ" },
      entra: { ADMIN: "MANAGE", OPERATION: "MANAGE" },
      idp: { ADMIN: "MANAGE", CHAPTER: "MANAGE", TALENT: "MANAGE", OPERATION: "READ" },
      evaluations: { ADMIN: "MANAGE", CHAPTER: "MANAGE", OPERATION: "READ" },
      "evaluations/periods": { ADMIN: "MANAGE" },
      "evaluations/templates": { ADMIN: "MANAGE" },
      "evaluations/my": { TALENT: "MANAGE" },
      accounts: { ADMIN: "MANAGE" },
      "admin/roles": { ADMIN: "MANAGE" },
      "master-data/units": { ADMIN: "MANAGE", CHAPTER: "READ", OPERATION: "READ" },
      "master-data/chapters": { ADMIN: "MANAGE", CHAPTER: "READ", OPERATION: "READ" },
      "master-data/job-roles": { ADMIN: "MANAGE", CHAPTER: "READ", OPERATION: "READ" },
      "master-data/projects": { ADMIN: "MANAGE", CHAPTER: "READ", OPERATION: "READ" },
      audit: { ADMIN: "READ" },
    };
    const entries = new Set<string>();
    for (const leaf of LEAVES) entries.add(menuEntryIdForHref(leaf.href));
    expect([...entries].sort()).toEqual(Object.keys(expected).sort());
    for (const [entry, roles] of Object.entries(expected)) {
      for (const role of ROLES) {
        expect(accessLevel(DEFAULT_MENU_ACCESS, role, entry), `${entry} × ${role}`).toBe(
          roles[role] ?? "NONE",
        );
      }
    }
  });
});
