import { describe, expect, it } from "vitest";
import {
  DEFAULT_MENU_ACCESS,
  MODULE_ENTRIES,
  defaultEntryReadable,
  moduleManageable,
  moduleReadable,
} from "./menuAccess";
import { MODULE_ROLES, type Module } from "./matrix";

describe("module access from the effective grid", () => {
  it("maps every module to menu entries", () => {
    for (const mod of Object.keys(MODULE_ROLES) as Module[]) {
      expect(MODULE_ENTRIES[mod].length, mod).toBeGreaterThan(0);
    }
  });

  it("derives read and manage from the caller's cells", () => {
    expect(moduleReadable(DEFAULT_MENU_ACCESS, "TALENT", "idp")).toBe(true);
    expect(moduleManageable(DEFAULT_MENU_ACCESS, "TALENT", "idp")).toBe(true);

    expect(moduleReadable(DEFAULT_MENU_ACCESS, "OPERATION", "employees")).toBe(true);
    expect(moduleManageable(DEFAULT_MENU_ACCESS, "OPERATION", "employees")).toBe(true);
    expect(moduleManageable(DEFAULT_MENU_ACCESS, "OPERATION", "evaluations")).toBe(false);

    expect(moduleReadable(DEFAULT_MENU_ACCESS, "CHAPTER", "masterData")).toBe(true);
    expect(moduleManageable(DEFAULT_MENU_ACCESS, "CHAPTER", "masterData")).toBe(false);
    expect(moduleReadable(DEFAULT_MENU_ACCESS, "TALENT", "masterData")).toBe(false);
  });

  it("treats a closed entry as no access for that module", () => {
    const config = {
      ...DEFAULT_MENU_ACCESS,
      TALENT: {
        ...DEFAULT_MENU_ACCESS.TALENT,
        idp: { visible: false, accessLevel: "NONE" as const },
      },
    };
    expect(moduleReadable(config, "TALENT", "idp")).toBe(false);
    expect(moduleManageable(config, "TALENT", "idp")).toBe(false);
  });

  it("mencerminkan default asisten data (TAN-344): Operation & Chapter READ", () => {
    // Mirror dari `set("assistant", "READ", ["OPERATION", "CHAPTER"])` —
    // gerbang statis lama sebagai akses efektif bawaan.
    expect(defaultEntryReadable("OPERATION", "assistant")).toBe(true);
    expect(defaultEntryReadable("CHAPTER", "assistant")).toBe(true);
    expect(defaultEntryReadable("ADMIN", "assistant")).toBe(false);
    expect(defaultEntryReadable("TALENT", "assistant")).toBe(false);
  });
});
