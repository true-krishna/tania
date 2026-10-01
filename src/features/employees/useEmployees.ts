"use client";

import type { Employee, EmployeeFilter } from "@/generated/graphql/types";
import { useMockQuery } from "@/lib/mock/useMockQuery";
import { employees, filterEmployees } from "./mock";

/**
 * Employees feature hook (Operation) — US1.
 *
 * Mock-backed while the backend US1 wave is unserved; swap body for the real
 * `employees(query, filter)` GraphQL query when live — return type already
 * matches the `EmployeeConnection.edges[].node` shape consumed by the pages.
 * Deps mirror the query variables so changing a filter re-fetches.
 */
export function useEmployees(filter: EmployeeFilter = {}) {
  return useMockQuery<Employee[]>(() => filterEmployees(employees, filter), [
    filter.search,
    filter.status,
    filter.unitId,
    filter.jobRoleId,
    filter.assignableOnly,
  ]);
}