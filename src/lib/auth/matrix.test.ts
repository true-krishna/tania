import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/generated/graphql";
import { canAccess, isModuleOpen, MODULE_ROLES, type Module } from "./matrix";

const ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

const EXPECTED: Record<Module, Record<AccessRole, boolean>> = {
  dashboard: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  activities: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  workload: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  employees: { ADMIN: true, OPERATION: true, CHAPTER: true, TALENT: true },
  entra: { ADMIN: false, OPERATION: true, CHAPTER: false, TALENT: false },
  contracts: { ADMIN: true, OPERATION: true, CHAPTER: false, TALENT: false },
  assignments: { ADMIN: false, OPERATION: true, CHAPTER: true, TALENT: true },
  idp: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  evaluations: { ADMIN: false, OPERATION: false, CHAPTER: false, TALENT: false },
  cv: { ADMIN: false, OPERATION: false, CHAPTER: true, TALENT: true },
  masterData: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  accounts: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
  audit: { ADMIN: true, OPERATION: false, CHAPTER: false, TALENT: false },
};

describe("role & module matrix (002-tania-rbac)", () => {
  for (const module of Object.keys(EXPECTED) as Module[]) {
    for (const role of ROLES) {
      it(`${module} × ${role} → ${EXPECTED[module][role] ? "allowed" : "denied"}`, () => {
        expect(canAccess(role, module)).toBe(EXPECTED[module][role]);
      });
    }
  }

  it("covers every module in the matrix", () => {
    expect(Object.keys(MODULE_ROLES).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("denies a missing session", () => {
    expect(canAccess(null, "dashboard")).toBe(false);
    expect(canAccess(undefined, "dashboard")).toBe(false);
  });

  it("keeps the deferred modules closed for every role", () => {
    expect(isModuleOpen("idp")).toBe(false);
    expect(isModuleOpen("evaluations")).toBe(false);
    expect(isModuleOpen("assignments")).toBe(true);
  });
});
