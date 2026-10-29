import { describe, expect, it } from "vitest";
import { currentRoleLabel } from "./roles";

const CATALOG = [
  { name: "CHAPTER", label: "Chapter" },
  { name: "PM_CHAPTER", label: "PM Chapter" },
];

describe("currentRoleLabel", () => {
  it("memakai label role kustom dari katalog", () => {
    // TAN-364 F9: PM_CHAPTER bukan "Chapter" — itu template-nya.
    expect(currentRoleLabel("PM_CHAPTER", "CHAPTER", CATALOG)).toBe("PM Chapter");
  });

  it("memakai label bawaan tanpa katalog", () => {
    expect(currentRoleLabel("CHAPTER", "CHAPTER", undefined)).toBe("Chapter");
    expect(currentRoleLabel(null, "TALENT", undefined)).toBe("Talent");
  });

  it("jatuh ke nama role saat katalog tidak tersedia, bukan label template", () => {
    expect(currentRoleLabel("PM_CHAPTER", "CHAPTER", undefined)).toBe("PM_CHAPTER");
    expect(currentRoleLabel("PM_OPERATION", "OPERATION", [])).toBe("PM_OPERATION");
  });
});
