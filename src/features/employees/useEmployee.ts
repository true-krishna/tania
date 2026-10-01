"use client";

import type { Employee } from "@/generated/graphql/types";
import { useMockQuery } from "@/lib/mock/useMockQuery";
import { employeeById } from "./mock";

/**
 * Single-employee lookup hook (Operation) — US1.
 * Mock-backed while the backend US1 wave is unserved; swap for the real
 * `employee(id)` query when live.
 */
export function useEmployee(id: string) {
  return useMockQuery<Employee | undefined>(() => employeeById(id), [id]);
}