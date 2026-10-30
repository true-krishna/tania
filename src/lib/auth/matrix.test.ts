import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/generated/graphql";
import { canAccess, canManage, isModuleOpen, MODULE_ROLES, type Module } from "./matrix";

const ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

const EXPECTED: Record<Module, Record<AccessRole, boolean>> = {
  // TAN-374 (keputusan TAN-364): Admin kembali memegang seluruh modul
  // operasional; Talent tetap tanpa Assignment (self-service ditunda) dan
  // Workload keluar dari matriks sampai TAN-378. TAN-392: Talent tanpa Data
  // Karyawan — record miliknya dibaca lewat Profil saya.
  dashboard: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  activities: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  employees: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  entra: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  contracts: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  assignments: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  // Aktif sejak 2026-10-16 (klarifikasi 9): entri menu ditampilkan untuk semua
  // peran, yang berbeda hanya aksesnya di dalam halaman (lihat EXPECTED_MANAGE).
  idp: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  evaluations: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  masterData: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  accounts: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  adminRoles: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  audit: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
};

/** TAN-374: Admin memegang penuh modul operasional lagi. */
const EXPECTED_MANAGE: Record<Module, Record<AccessRole, boolean>> = {
  dashboard: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  activities: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  employees: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  entra: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  contracts: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  assignments: { ADMIN: true, OPERATION: false, CHAPTER: true, TALENT: false },
  // IDP & evaluasi: Chapter mengelola dalam cakupannya, Admin penuh; Operation
  // hanya baca dan Talent hanya miliknya (klarifikasi 9).
  idp: { ADMIN: true, OPERATION: false, CHAPTER: true, TALENT: false },
  evaluations: { ADMIN: true, OPERATION: false, CHAPTER: true, TALENT: false },
  masterData: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  accounts: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  adminRoles: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  audit: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
};

describe("role & module matrix (002-tania-rbac)", () => {
  for (const mod of Object.keys(EXPECTED) as Module[]) {
    for (const role of ROLES) {
      it(`${mod} × ${role} → ${EXPECTED[mod][role] ? "allowed" : "denied"}`, () => {
        expect(canAccess(role, mod)).toBe(EXPECTED[mod][role]);
      });
    }
  }

  for (const mod of Object.keys(EXPECTED_MANAGE) as Module[]) {
    for (const role of ROLES) {
      it(`manage ${mod} × ${role} → ${EXPECTED_MANAGE[mod][role] ? "allowed" : "denied"}`, () => {
        expect(canManage(role, mod)).toBe(EXPECTED_MANAGE[mod][role]);
      });
    }
  }

  it("covers every module in the matrix", () => {
    expect(Object.keys(MODULE_ROLES).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("denies a missing session", () => {
    expect(canAccess(null, "dashboard")).toBe(false);
    expect(canAccess(undefined, "dashboard")).toBe(false);
    expect(canManage(null, "employees")).toBe(false);
    expect(canManage(undefined, "assignments")).toBe(false);
  });

  it("membuka IDP & Evaluation setelah aktivasi (klarifikasi 9)", () => {
    expect(isModuleOpen("idp")).toBe(true);
    expect(isModuleOpen("evaluations")).toBe(true);
    expect(isModuleOpen("assignments")).toBe(true);
  });
});
