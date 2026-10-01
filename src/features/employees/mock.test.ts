import { describe, expect, it } from "vitest";
import { employees, filterEmployees } from "./mock";

describe("filterEmployees", () => {
  it("filters by search across name, email, and employee code", () => {
    const byName = filterEmployees(employees, { search: "budi" });
    expect(byName.map((e) => e.id)).toEqual(["emp-002"]);

    const byEmail = filterEmployees(employees, { search: "citra.lestari" });
    expect(byEmail.map((e) => e.id)).toEqual(["emp-003"]);

    const byCode = filterEmployees(employees, { search: "EMP-0005" });
    expect(byCode.map((e) => e.id)).toEqual(["emp-005"]);
  });

  it("filters by unit", () => {
    const unitDigital = employees[0].unit.id;
    const result = filterEmployees(employees, { unitId: unitDigital });
    expect(result.every((e) => e.unit.id === unitDigital)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by status", () => {
    const active = filterEmployees(employees, { status: "ACTIVE" });
    expect(active.every((e) => e.status === "ACTIVE")).toBe(true);
    expect(active.length).toBe(employees.filter((e) => e.status === "ACTIVE").length);
  });

  it("filters assignable only", () => {
    const result = filterEmployees(employees, { assignableOnly: true });
    expect(result.every((e) => e.assignable)).toBe(true);
    expect(result.some((e) => e.id === "emp-005")).toBe(false);
  });

  it("returns everything for an empty filter", () => {
    expect(filterEmployees(employees, {})).toHaveLength(employees.length);
  });

  it("returns union of combined filters", () => {
    const activeIn = filterEmployees(employees, {
      search: "emp-",
      status: "ACTIVE",
    });
    expect(activeIn.every((e) => e.status === "ACTIVE")).toBe(true);
  });
});