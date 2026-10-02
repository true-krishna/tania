"use client";

import type { Assignment } from "@/generated/graphql/types";
import { useMockQuery } from "@/lib/mock/useMockQuery";
import { assignmentById } from "./mock";

/**
 * Single-assignment lookup hook (Chapter) — US2.
 * Mock-backed while the backend US2 wave is unserved; swap for the real
 * `assignment(id)` query when live.
 */
export function useAssignment(id: string) {
  return useMockQuery<Assignment | undefined>(() => assignmentById(id), [id]);
}