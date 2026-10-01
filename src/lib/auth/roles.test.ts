import { describe, expect, it } from "vitest";
import { atLeast, ROLE_ORDER } from "./roles";

describe("roles", () => {
  it("orders roles TALENT < CHAPTER < OPERATION < ADMIN", () => {
    expect(ROLE_ORDER.TALENT).toBeLessThan(ROLE_ORDER.CHAPTER);
    expect(ROLE_ORDER.CHAPTER).toBeLessThan(ROLE_ORDER.OPERATION);
    expect(ROLE_ORDER.OPERATION).toBeLessThan(ROLE_ORDER.ADMIN);
  });

  it("allows exact-match role", () => {
    expect(atLeast("OPERATION", "OPERATION")).toBe(true);
  });

  it("allows roles at or above the required one", () => {
    expect(atLeast("ADMIN", "OPERATION")).toBe(true);
  });

  it("rejects roles below the required one", () => {
    expect(atLeast("TALENT", "OPERATION")).toBe(false);
    expect(atLeast("CHAPTER", "ADMIN")).toBe(false);
  });

  it("rejects null or undefined current role", () => {
    expect(atLeast(null, "TALENT")).toBe(false);
    expect(atLeast(undefined, "TALENT")).toBe(false);
  });
});