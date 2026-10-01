/**
 * Static dataset for the accounts feature (Admin) — US6.
 *
 * Placeholder while the backend wave is unserved (owner sign-off on mock-first).
 * `employee` is intentionally `undefined` (optional in the contract schema) so
 * the page renders the account without needing a nested employee graph.
 */
import type { User } from "@/generated/graphql/types";

const base = {
  employee: undefined,
  createdAt: "2025-01-15T08:00:00Z",
  updatedAt: "2025-06-20T08:00:00Z",
} as const;

export const users: User[] = [
  {
    ...base,
    id: "usr-001",
    email: "admin@tania.id",
    fullName: "Rina Wijaya",
    accessRole: "ADMIN",
    status: "ACTIVE",
    lastLoginAt: "2025-06-19T09:30:00Z",
  },
  {
    ...base,
    id: "usr-002",
    email: "operation@tania.id",
    fullName: "Budi Santoso",
    accessRole: "OPERATION",
    status: "ACTIVE",
    lastLoginAt: "2025-06-18T14:12:00Z",
  },
  {
    ...base,
    id: "usr-003",
    email: "chapter@tania.id",
    fullName: "Sari Dewi",
    accessRole: "CHAPTER",
    status: "ACTIVE",
    lastLoginAt: "2025-06-17T10:05:00Z",
  },
  {
    ...base,
    id: "usr-004",
    email: "talent@tania.id",
    fullName: "Andi Pratama",
    accessRole: "TALENT",
    status: "ACTIVE",
    lastLoginAt: "2025-06-19T08:45:00Z",
  },
  {
    ...base,
    id: "usr-005",
    email: "former.lead@tania.id",
    fullName: "Lestari Putri",
    accessRole: "ADMIN",
    status: "INACTIVE",
    lastLoginAt: "2025-03-02T11:20:00Z",
  },
];

export const roleLabel: Record<User["accessRole"], string> = {
  ADMIN: "Admin",
  OPERATION: "Operation",
  CHAPTER: "Chapter",
  TALENT: "Talent",
};