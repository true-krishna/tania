import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/generated/graphql";
import { canAccess, MODULE_ROLES, type Module } from "@/lib/auth/matrix";
import { NAV, sectionForPath } from "./nav";

const ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

/** Setiap href sidebar milik satu modul matriks. */
const MODULE_OF: Record<string, Module> = {
  "/dashboard": "dashboard",
  "/activities": "activities",
  "/workload": "workload",
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

interface Leaf {
  href: string;
  label: string;
  roles: readonly AccessRole[];
}

const LEAVES: Leaf[] = NAV.flatMap((entry) =>
  entry.kind === "link"
    ? [{ href: entry.href, label: entry.label, roles: entry.roles }]
    : entry.children.map((child) => ({ href: child.href, label: child.label, roles: child.roles }))
);

/**
 * R2.2 — the sidebar mirrors the role & module matrix. Since the 2026-10-16
 * activation (klarifikasi 9) a module may hold several pages with different
 * per-role visibility (Evaluations: Roster vs. Periode/Template vs. Evaluasi
 * Saya), so the invariant is no longer strict equality per leaf but:
 *   1. no dead link — a visible leaf's module is open for that role, and
 *   2. full coverage — every role that may open a module sees at least one of
 *      its entries, which is what keeps IDP & Evaluation "tampil untuk semua
 *      peran, aksesnya yang berbeda".
 */
describe("NAV mirrors the role & module matrix (R2.2)", () => {
  for (const leaf of LEAVES) {
    it(`${leaf.href} punya modul matriks`, () => {
      expect(MODULE_OF[leaf.href], `${leaf.href} tidak dipetakan ke modul`).toBeDefined();
    });

    for (const role of ROLES) {
      if (!leaf.roles.includes(role)) continue;
      it(`${leaf.label} × ${role} → modulnya terbuka`, () => {
        expect(canAccess(role, MODULE_OF[leaf.href])).toBe(true);
      });
    }
  }

  it("setiap peran yang boleh membuka modul melihat minimal satu entri modul itu", () => {
    for (const mod of Object.keys(MODULE_ROLES) as Module[]) {
      const leaves = LEAVES.filter((leaf) => MODULE_OF[leaf.href] === mod);
      expect(leaves.length, `modul ${mod} tidak punya entri sidebar`).toBeGreaterThan(0);
      for (const role of ROLES) {
        if (!canAccess(role, mod)) continue;
        const visible = leaves.filter((leaf) => leaf.roles.includes(role));
        expect(
          visible.length,
          `${role} boleh membuka ${mod} tetapi tidak melihat entri apa pun`
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

  it("menandai seksi aktif dari submenu terdalam", () => {
    expect(sectionForPath("/employees/emp-1")).toBe("Employee");
    expect(sectionForPath("/assignments")).toBe("Employee");
    expect(sectionForPath("/master-data/units")).toBe("Master Data");
  });
});
