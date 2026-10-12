"use client";

import { useQuery } from "@apollo/client";
import {
  EmployeesWithoutEntraDocument,
  type EmployeesWithoutEntraQuery,
  type EmployeesWithoutEntraQueryVariables,
} from "@/generated/graphql";

type EmployeeNode =
  EmployeesWithoutEntraQuery["employeesWithoutEntra"]["edges"][number]["node"];

/** Query variables of the FR-44 list — shared with refetches after provisioning. */
export const ENTRA_LIST_VARIABLES = { first: 100, after: null } as const;

export type EmployeesWithoutEntraState = {
  status: "loading" | "ready" | "error";
  employees: EmployeeNode[] | undefined;
  totalCount: number;
  error: string | null;
};

/**
 * FR-44 list: active talent without a linked Entra account — never provisioned
 * or the last attempt failed. Rows carry the recorded provisioning outcome so
 * a failed attempt is visible and can be retried (T034).
 */
export function useEmployeesWithoutEntra(): EmployeesWithoutEntraState {
  const { loading, error, data } = useQuery<
    EmployeesWithoutEntraQuery,
    EmployeesWithoutEntraQueryVariables
  >(EmployeesWithoutEntraDocument, {
    variables: { first: ENTRA_LIST_VARIABLES.first, after: ENTRA_LIST_VARIABLES.after },
  });

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    employees: data?.employeesWithoutEntra.edges.map((edge) => edge.node),
    totalCount: data?.employeesWithoutEntra.totalCount ?? 0,
    error: error?.message ?? null,
  };
}
