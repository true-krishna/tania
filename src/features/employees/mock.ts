/**
 * Static dataset for the employees feature (Operation) — US1.
 *
 * Placeholder while the backend US1 wave is unserved (owner sign-off on
 * mock-first). References the master-data datasets for unit/jobRole/chapter so
 * the mock graph is internally consistent; swap onto the live `employees` query
 * via `useEmployees.ts` when the wave lands.
 */
import type { Employee, EmployeeFilter } from "@/generated/graphql/types";
import { chapters, jobRoles, units } from "@/features/master-data/mock";

const emptyConn = {
  edges: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: undefined, endCursor: undefined },
  totalCount: 0,
};

export const employees: Employee[] = [
  {
    __typename: "Employee",
    id: "emp-001",
    employeeCode: "EMP-0001",
    fullName: "Andi Pratama",
    email: "andi.pratama@tania.co.id",
    unit: units[0],
    jobRole: jobRoles[0],
    chapter: chapters[0],
    assignable: true,
    joinedAt: "2023-04-10",
    status: "ACTIVE",
    account: undefined,
    assignments: emptyConn,
    idps: emptyConn,
    createdAt: "2023-04-10T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Employee",
    id: "emp-002",
    employeeCode: "EMP-0002",
    fullName: "Budi Santoso",
    email: "budi.santoso@tania.co.id",
    unit: units[1],
    jobRole: jobRoles[2],
    chapter: chapters[1],
    assignable: true,
    joinedAt: "2022-11-02",
    status: "ACTIVE",
    account: undefined,
    assignments: emptyConn,
    idps: emptyConn,
    createdAt: "2022-11-02T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Employee",
    id: "emp-003",
    employeeCode: "EMP-0003",
    fullName: "Citra Lestari",
    email: "citra.lestari@tania.co.id",
    unit: units[2],
    jobRole: jobRoles[3],
    chapter: chapters[2],
    assignable: true,
    joinedAt: "2024-01-15",
    status: "ACTIVE",
    account: undefined,
    assignments: emptyConn,
    idps: emptyConn,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Employee",
    id: "emp-004",
    employeeCode: "EMP-0004",
    fullName: "Dewi Anggraini",
    email: "dewi.anggraini@tania.co.id",
    unit: units[0],
    jobRole: jobRoles[1],
    chapter: chapters[0],
    assignable: true,
    joinedAt: "2021-07-20",
    status: "ACTIVE",
    account: undefined,
    assignments: emptyConn,
    idps: emptyConn,
    createdAt: "2021-07-20T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Employee",
    id: "emp-005",
    employeeCode: "EMP-0005",
    fullName: "Eko Prasetyo",
    email: "eko.prasetyo@tania.co.id",
    unit: units[3],
    jobRole: jobRoles[4],
    chapter: chapters[3],
    assignable: false,
    joinedAt: "2019-03-05",
    status: "INACTIVE",
    account: undefined,
    assignments: emptyConn,
    idps: emptyConn,
    createdAt: "2019-03-05T08:00:00Z",
    updatedAt: "2025-03-15T08:00:00Z",
  },
];

export function filterEmployees(list: Employee[], filter: EmployeeFilter): Employee[] {
  return list.filter((emp) => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const haystack = `${emp.fullName} ${emp.email} ${emp.employeeCode}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filter.unitId && emp.unit.id !== filter.unitId) return false;
    if (filter.jobRoleId && emp.jobRole.id !== filter.jobRoleId) return false;
    if (filter.status && emp.status !== filter.status) return false;
    if (filter.assignableOnly && !emp.assignable) return false;
    return true;
  });
}

export const employeeById = (id: string): Employee | undefined =>
  employees.find((e) => e.id === id);