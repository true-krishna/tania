import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/generated/graphql";
import { canAccess, canManage, isModuleOpen, MODULE_ROLES, type Module } from "./matrix";

const ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

const EXPECTED: Record<Module, Record<AccessRole, boolean>> = {
  dashboard: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  activities: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  workload: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  employees: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  entra: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  contracts: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  assignments: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  // Ditunda (T032): tidak ada peran yang boleh masuk sampai modulnya diaktifkan
  // (T084) — barisnya kosong, sama seperti backend menolaknya untuk semua peran.
  idp: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  evaluations: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  cv: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  masterData: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: false },
  accounts: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  audit: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
};

/** Admin manages every active module (TAN-212 clarify 4); Talent never does. */
const EXPECTED_MANAGE: Record<Module, Record<AccessRole, boolean>> = {
  dashboard: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  activities: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  workload: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  employees: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  entra: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  contracts: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  assignments: { ADMIN: true, OPERATION: false, CHAPTER: true, TALENT: false },
  idp: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  evaluations: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  cv: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  masterData: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  accounts: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
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

  it("menutup IDP & Evaluation untuk semua peran selama ditunda (T032)", () => {
    expect(isModuleOpen("idp")).toBe(false);
    expect(isModuleOpen("evaluations")).toBe(false);
    expect(isModuleOpen("assignments")).toBe(true);
  });
});
