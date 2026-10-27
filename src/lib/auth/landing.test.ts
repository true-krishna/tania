import { describe, expect, it } from "vitest";
import { landingRoute } from "./landing";

describe("landingRoute (TAN-343)", () => {
  it("mendaratkan setiap peran di halaman muka sesuai sel defaultnya", () => {
    expect(landingRoute("OPERATION")).toBe("/dashboard");
    expect(landingRoute("CHAPTER")).toBe("/dashboard");
    expect(landingRoute("ADMIN")).toBe("/accounts");
    expect(landingRoute("TALENT")).toBe("/employees");
  });

  it("tanpa sesi kembali ke halaman login", () => {
    expect(landingRoute(null)).toBe("/login");
    expect(landingRoute(undefined)).toBe("/login");
  });
});
