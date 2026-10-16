import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/generated/graphql";
import { canAccess, type Module } from "@/lib/auth/matrix";
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
  "/cv": "cv",
  "/master-data/units": "masterData",
  "/master-data/chapters": "masterData",
  "/master-data/job-roles": "masterData",
  "/master-data/projects": "masterData",
  "/accounts": "accounts",
  "/audit": "audit",
};

/**
 * Entri IDP & Evaluation disembunyikan untuk semua peran selagi modulnya ditunda
 * (matriks menandainya ✘ untuk setiap peran) — jadi entri ini memang **tidak**
 * dicerminkan oleh `canAccess`, yang masih menyisakan baris/route pada baseline
 * TAN-178 (utang T032: tutup route-nya secara eksplisit).
 */
const AS_IS_HREFS = ["/idp", "/evaluations", "/evaluations/periods", "/evaluations/templates", "/evaluations/my"];

interface Leaf {
  href: string;
  label: string;
  roles: readonly AccessRole[];
}

const LEAVES: Leaf[] = NAV.flatMap((entry) =>
  entry.kind === "link"
    ? [{ href: entry.href, label: entry.label, roles: entry.roles }]
    : entry.children.map((child) => ({ href: child.href, label: child.label, roles: child.roles }))
).filter((leaf) => !AS_IS_HREFS.includes(leaf.href));

describe("NAV mirrors the role & module matrix (R2.2)", () => {
  for (const leaf of LEAVES) {
    const mod = MODULE_OF[leaf.href];
    it(`${leaf.href} punya modul matriks`, () => {
      expect(mod, `${leaf.href} tidak dipetakan ke modul`).toBeDefined();
    });

    for (const role of ROLES) {
      it(`${leaf.label} × ${role} → ${canAccess(role, mod!) ? "tampil" : "tidak tampil"}`, () => {
        expect(leaf.roles.includes(role)).toBe(canAccess(role, mod!));
      });
    }
  }

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
