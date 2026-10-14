import { describe, expect, it } from "vitest";
import { orDash } from "./cell";

describe("orDash", () => {
  it("returns a dash for null, undefined, and blank strings", () => {
    expect(orDash(null)).toBe("-");
    expect(orDash(undefined)).toBe("-");
    expect(orDash("")).toBe("-");
    expect(orDash("   ")).toBe("-");
  });

  it("returns the value text otherwise", () => {
    expect(orDash("Budi")).toBe("Budi");
    expect(orDash(0)).toBe("0");
    expect(orDash("  Budi ")).toBe("  Budi ");
  });
});
