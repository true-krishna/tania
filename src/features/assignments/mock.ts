/**
 * Static dataset for the assignments feature (Chapter) — US2.
 *
 * Placeholder while the backend US2 wave is unserved (owner sign-off on
 * mock-first). References the master-data and employees datasets so the mock
 * graph is internally consistent; swap onto the live `assignments` query via
 * `useAssignments.ts` when the wave lands.
 */
import type { Assignment, AssignmentFilter } from "@/generated/graphql/types";
import { jobRoles, projects } from "@/features/master-data/mock";
import { employees } from "@/features/employees/mock";

export const assignments: Assignment[] = [
  {
    __typename: "Assignment",
    id: "asg-001",
    talent: employees[0], // Andi Pratama
    project: projects[0],
    jobRole: jobRoles[0],
    periodStart: "2025-01-06",
    periodEnd: "2025-06-30",
    status: "COMPLETED",
    createdBy: undefined,
    createdAt: "2024-12-20T08:00:00Z",
    updatedAt: "2025-07-01T08:00:00Z",
  },
  {
    __typename: "Assignment",
    id: "asg-002",
    talent: employees[1], // Budi Santoso
    project: projects[1],
    jobRole: jobRoles[2],
    periodStart: "2025-03-10",
    periodEnd: null,
    status: "ACTIVE",
    createdBy: undefined,
    createdAt: "2025-03-01T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Assignment",
    id: "asg-003",
    talent: employees[3], // Dewi Anggraini
    project: projects[0],
    jobRole: jobRoles[1],
    periodStart: "2025-05-05",
    periodEnd: null,
    status: "ACTIVE",
    createdBy: undefined,
    createdAt: "2025-04-28T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Assignment",
    id: "asg-004",
    talent: employees[2], // Citra Lestari
    project: projects[2],
    jobRole: jobRoles[3],
    periodStart: "2024-10-01",
    periodEnd: "2025-03-31",
    status: "COMPLETED",
    createdBy: undefined,
    createdAt: "2024-09-20T08:00:00Z",
    updatedAt: "2025-04-01T08:00:00Z",
  },
];

export function filterAssignments(
  list: Assignment[],
  filter: AssignmentFilter
): Assignment[] {
  return list.filter((asg) => {
    if (filter.employeeId && asg.talent.id !== filter.employeeId) return false;
    if (filter.projectId && asg.project.id !== filter.projectId) return false;
    if (filter.status && asg.status !== filter.status) return false;
    return true;
  });
}

export const assignmentById = (id: string): Assignment | undefined =>
  assignments.find((a) => a.id === id);