"use client";

import type { Chapter, JobRole, Project, Unit } from "@/generated/graphql/types";
import { useMockQuery } from "@/lib/mock/useMockQuery";
import {
  chapters,
  jobRoles,
  projects,
  units,
} from "./mock";

/**
 * Master-data feature hooks (Admin) — US6.
 *
 * Currently backed by `./mock` static datasets while the backend wave is
 * unserved (owner sign-off: "mock dulu, integrasi kemudian"). Each hook is
 * deliberately a thin seam over one contract query (`units`, `chapters`,
 * `jobRoles`, `projects`) so it can be swapped for the real Apollo `useQuery`
 * without touching components. Return types already match the contract schema.
 */
export function useUnits() {
  return useMockQuery<Unit[]>(() => units);
}

export function useChapters() {
  return useMockQuery<Chapter[]>(() => chapters);
}

export function useJobRoles() {
  return useMockQuery<JobRole[]>(() => jobRoles);
}

export function useProjects() {
  return useMockQuery<Project[]>(() => projects);
}